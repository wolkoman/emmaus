"use server";
import { slack } from "@/app/(shared)/Slack";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import {
  CpPaperArticlesStatus,
  CpPersonCompetences,
} from "@/util/cockpit.generated";
import {
  fetchOnePaperArticle,
  fetchPaperArticles,
  updatePaperArticle,
} from "@/domain/paper/paper-repo";

const STATUS_EMOJIS = {
  [CpPaperArticlesStatus.Writing]: ":writing:",
  [CpPaperArticlesStatus.Written]: ":written:",
  [CpPaperArticlesStatus.Corrected]: ":corrected:",
  [CpPaperArticlesStatus.Finished]: ":finished:",
} as const;

const MILESTONE_CONFIG = {
  written: {
    emojis: { 25: "🎯", 50: "🚀", 75: "⭐", 100: "🎉" },
    messages: {
      25: "Ein Viertel geschrieben!",
      50: "Halbzeit beim Schreiben!",
      75: "Drei Viertel geschrieben!",
      100: "Alle Artikel geschrieben!",
    },
    description: "geschrieben",
  },
  corrected: {
    emojis: { 25: "📝", 50: "✍️", 75: "📚", 100: "✅" },
    messages: {
      25: "Ein Viertel lektoriert!",
      50: "Halbzeit beim Lektorat!",
      75: "Drei Viertel lektoriert!",
      100: "Alle Artikel lektoriert!",
    },
    description: "lektoriert",
  },
  finished: {
    emojis: { 25: "🌟", 50: "💫", 75: "🏆", 100: "🎊" },
    messages: {
      25: "Ein Viertel fertiggestellt!",
      50: "Halbzeit bei der Fertigstellung!",
      75: "Drei Viertel fertiggestellt!",
      100: "Alle Artikel komplett fertiggestellt! 🎉🎉🎉",
    },
    description: "komplett fertiggestellt",
  },
} as const;

const STATUS_DISPLAY = {
  written: "geschrieben",
  writing: "gestartet",
  finished: "fertiggestellt",
  corrected: "lektoriert",
} as const;

function calculateStatusCounts(articles: any[]) {
  return {
    writing: articles.filter((a) => a.status === CpPaperArticlesStatus.Writing)
      .length,
    written: articles.filter((a) => a.status === CpPaperArticlesStatus.Written)
      .length,
    corrected: articles.filter(
      (a) => a.status === CpPaperArticlesStatus.Corrected,
    ).length,
    finished: articles.filter(
      (a) => a.status === CpPaperArticlesStatus.Finished,
    ).length,
  };
}

function isInStatusCategory(
  status: CpPaperArticlesStatus,
  category: "written" | "corrected" | "finished",
): boolean {
  const categories = {
    written: [
      CpPaperArticlesStatus.Written,
      CpPaperArticlesStatus.Corrected,
      CpPaperArticlesStatus.Finished,
    ],
    corrected: [
      CpPaperArticlesStatus.Corrected,
      CpPaperArticlesStatus.Finished,
    ],
    finished: [CpPaperArticlesStatus.Finished],
  };
  return categories[category].includes(status);
}

function calculateMilestoneProgress(
  previousStatus: CpPaperArticlesStatus,
  newStatus: CpPaperArticlesStatus,
  category: "written" | "corrected" | "finished",
  currentCount: number,
  totalArticles: number,
) {
  const wasInCategory = isInStatusCategory(previousStatus, category);
  const isNowInCategory = isInStatusCategory(newStatus, category);

  const previousCount = wasInCategory
    ? currentCount
    : isNowInCategory
      ? currentCount - 1
      : currentCount;

  const previousPercentage =
    totalArticles > 0 ? Math.round((previousCount / totalArticles) * 100) : 0;
  const currentPercentage =
    totalArticles > 0 ? Math.round((currentCount / totalArticles) * 100) : 0;

  return { previousPercentage, currentPercentage, currentCount };
}

async function postMilestoneMessage(
  channel: string,
  category: "written" | "corrected" | "finished",
  milestone: number,
  currentCount: number,
  totalArticles: number,
  currentPercentage: number,
) {
  const config = MILESTONE_CONFIG[category];
  const emoji = config.emojis[milestone as keyof typeof config.emojis];
  const message = config.messages[milestone as keyof typeof config.messages];
  const description = config.description;

  await slack("chat.postMessage", {
    channel,
    text:
      `${emoji} *${message}*\n` +
      `${currentPercentage}% der Artikel wurden ${description} (${currentCount}/${totalArticles})`,
  });
}

export async function saveEditorStatus(
  articleId: string,
  status: CpPaperArticlesStatus,
) {
  const article = await fetchOnePaperArticle(articleId);

  if (!article) {
    throw new Error("Article not found");
  }

  const user = await resolveUserFromServer();
  if (
    (article.status !== CpPaperArticlesStatus.Writing ||
      status !== CpPaperArticlesStatus.Written) &&
    !user?.competences.includes(CpPersonCompetences.Editor)
  ) {
    throw new Error();
  }

  await updatePaperArticle(articleId, { status });

  const channel =
    process.env.NODE_ENV === "production" ? "C047C4D4R7B" : "U0HJVFER4";
  const articles = await fetchPaperArticles(article.project._id);

  const statusCounts = calculateStatusCounts(articles);
  const totalArticles = articles.length;

  // Post status update message
  await slack("chat.postMessage", {
    channel,
    text: `${STATUS_EMOJIS[status] ?? STATUS_EMOJIS[CpPaperArticlesStatus.Writing]} *${article.name}* wurde ${STATUS_DISPLAY[status]}`,
  });

  // Check and post milestone messages
  const milestones = [25, 50, 75, 100];
  const categories: Array<{
    name: "written" | "corrected" | "finished";
    count: number;
  }> = [
    {
      name: "written",
      count:
        statusCounts.written + statusCounts.corrected + statusCounts.finished,
    },
    {
      name: "corrected",
      count: statusCounts.corrected + statusCounts.finished,
    },
    { name: "finished", count: statusCounts.finished },
  ];

  for (const { name, count } of categories) {
    const progress = calculateMilestoneProgress(
      article.status,
      status,
      name,
      count,
      totalArticles,
    );
    const milestone = milestones.find(
      (m) => progress.currentPercentage >= m && progress.previousPercentage < m,
    );
    if (milestone) {
      await postMilestoneMessage(
        channel,
        name,
        milestone,
        progress.currentCount,
        totalArticles,
        progress.currentPercentage,
      );
    }
  }
}
