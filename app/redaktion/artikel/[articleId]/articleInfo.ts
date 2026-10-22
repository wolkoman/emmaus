import {
  CpPaperArticles,
  CpPaperArticlesStatus,
  CpPaperProjects,
} from "@/util/cockpit.generated";

export const ARTICLE_STATUSES = [
  { value: CpPaperArticlesStatus.Writing, label: "In Arbeit" },
  { value: CpPaperArticlesStatus.Written, label: "Geschrieben" },
  { value: CpPaperArticlesStatus.Corrected, label: "Lektoriert" },
  { value: CpPaperArticlesStatus.Finished, label: "Fertiggestellt" },
] as const;

/** Length target from the format, e.g. "C2600x3600x1" = 1 page, 2600–3600. */
export function articleLength(article: CpPaperArticles) {
  const [min, max, pages] = article.format.replace("C", "").split("x");
  return {
    min: parseInt(min),
    max: parseInt(max),
    pages: pages
      ? `${pages} Seite${pages[0] === "1" ? "" : "n"}`
      : article.format,
  };
}

export function articleDeadline(project: CpPaperProjects) {
  const deadline = new Date(project.deadline);
  const daysLeft = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  return {
    date: deadline.toLocaleDateString("de-AT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    daysLeft,
    label:
      daysLeft < 0
        ? `${-daysLeft} ${daysLeft === -1 ? "Tag" : "Tage"} überschritten`
        : `noch ${daysLeft} ${daysLeft === 1 ? "Tag" : "Tage"}`,
    tone: (daysLeft < 0 ? "late" : daysLeft <= 3 ? "soon" : "ok") as
      | "late"
      | "soon"
      | "ok",
  };
}

export function isSubmitted(article: CpPaperArticles) {
  return article.status !== CpPaperArticlesStatus.Writing && !!article.status;
}
