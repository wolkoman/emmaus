import { Links } from "@/app/(shared)/Links";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { formatDate } from "@/app/(shared)/Localization";
import { ARTICLE_STATUSES } from "@/app/redaktion/artikel/[articleId]/articleInfo";
import {
  AppTable,
  AppTableHeader,
  AppTableRow,
} from "@/components/intern/AppTable";
import {
  AppCard,
  PageHeading,
  SectionHeading,
} from "@/components/intern/AppUI";
import { cn } from "@/util/utils";
import { Button } from "@/components/ui/button";
import {
  CpPaperArticlesStatus,
  CpPersonCompetences,
} from "@/util/cockpit.generated";
import {
  fetchOnePaperProject,
  fetchPaperArticles,
  fetchPaperProjects,
  fetchPaperStats,
} from "@/domain/paper/paper-repo";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PiFilePdf, PiTable } from "react-icons/pi";
import { describeArticleLength } from "@/app/redaktion/artikel/[articleId]/Format";
import { ArticleQuickLinks } from "./ArticleQuickLinks";
import { CreateArticleDialog } from "./CreateArticleDialog";
import { ProjectStatsChart } from "./ProjectStatsChart";

export async function EditorProjectPage(props: { projectId: string }) {
  const person = await resolveUserFromServer();

  if (!person) {
    redirect(
      Links.LoginRedirect(Links.ProjektplattformProjekt(props.projectId)),
    );
  }
  if (!person.competences.includes(CpPersonCompetences.Editor)) notFound();

  const articles = await fetchPaperArticles(props.projectId);
  const project = await fetchOnePaperProject(props.projectId);
  if (!project) notFound();
  const stats = await fetchPaperStats(props.projectId);
  const countStatus = (status: CpPaperArticlesStatus) =>
    articles.filter((article) => article.status === status).length;
  const finished = countStatus(CpPaperArticlesStatus.Finished);
  const corrected = countStatus(CpPaperArticlesStatus.Corrected) + finished;
  const liveStats = {
    written: countStatus(CpPaperArticlesStatus.Written) + corrected,
    corrected,
    finished,
  };
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Vienna",
  });
  const earlierProjects = (await fetchPaperProjects()).filter(
    (earlier) =>
      earlier._id !== project._id &&
      earlier.deadline &&
      project.deadline &&
      earlier.deadline < project.deadline,
  );
  const earlierStats = (
    await Promise.all(
      earlierProjects.map(async (earlier) => ({
        project: earlier,
        stats: await fetchPaperStats(earlier._id),
      })),
    )
  ).filter(({ stats }) => stats.length > 0);

  // Link to this project's articles in the Pocketbase admin UI.
  const pbArticlesUrl = `https://db.emmaus.wien/_/#/collections?collection=paper_articles&filter=${encodeURIComponent(
    `project.name = "${project.name}"`,
  )}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title={`Projekt ${project.name}`}
          description={
            project.deadline &&
            `Redaktionsschluss ${formatDate(project.deadline, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}`
          }
        />
        <div className="flex gap-2">
          <a href={pbArticlesUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <PiTable /> Artikel verwalten
            </Button>
          </a>
          <CreateArticleDialog projectId={props.projectId} />
        </div>
      </div>

      {project.pdfUrl && (
        <section>
          <SectionHeading title="Ausgabe" />
          <AppCard className="flex items-center gap-6 p-4">
            {project.coverUrl && (
              <a
                href={project.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={project.coverUrl}
                  alt={`Titelseite ${project.name}`}
                  className="w-32 rounded border border-neutral-200"
                />
              </a>
            )}
            <div className="flex flex-col items-start gap-3">
              {project.published && (
                <div className="font-medium">
                  Erschienen{" "}
                  {formatDate(project.published, {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
              <a
                href={project.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <PiFilePdf /> PDF öffnen
                </Button>
              </a>
            </div>
          </AppCard>
        </section>
      )}

      <ProjectStatsChart
        stats={stats}
        project={project}
        earlierStats={earlierStats}
        liveStats={liveStats}
        today={today}
      />

      <section>
        <SectionHeading title={`Artikel (${articles.length})`} />
        <AppTable>
          <AppTableHeader className={cn("hidden lg:grid", ARTICLE_COLUMNS)}>
            <div>Artikel</div>
            <div>Status</div>
            <div>Umfang</div>
            <div>Autor:in</div>
          </AppTableHeader>
          {articles
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((article) => (
              <AppTableRow
                key={article._id}
                className={cn(ARTICLE_COLUMNS, "items-center gap-y-0.5")}
              >
                <Link
                  href={Links.ProjektplattformArtikel(article._id)}
                  className="hover:text-emmaus truncate text-sm font-medium"
                >
                  {article.name}
                </Link>
                <div className="flex items-center gap-1.5 text-sm text-black/70">
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      STATUS_COLORS[article.status] ?? STATUS_COLORS.writing,
                    )}
                  />
                  {ARTICLE_STATUSES.find((s) => s.value === article.status)
                    ?.label ?? "In Arbeit"}
                </div>
                <div className="text-sm text-black/60">
                  {describeArticleLength(article)}
                </div>
                <div className="truncate text-sm text-black/60">
                  {article.author}
                </div>
                <div className="col-start-2 row-span-4 row-start-1 flex justify-end lg:col-auto lg:row-auto">
                  <ArticleQuickLinks
                    articleId={article._id}
                    gid={article.gid}
                  />
                </div>
              </AppTableRow>
            ))}
        </AppTable>
      </section>
    </div>
  );
}

const ARTICLE_COLUMNS =
  "grid grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,1fr)_8rem_7rem_12rem_5rem] lg:gap-x-4";

const STATUS_COLORS: Record<string, string> = {
  finished: "bg-fuchsia-600",
  corrected: "bg-green-600",
  written: "bg-lime-400",
  writing: "bg-yellow-300",
};
