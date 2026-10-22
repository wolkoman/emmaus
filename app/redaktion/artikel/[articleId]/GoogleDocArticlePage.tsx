import { Links } from "@/app/(shared)/Links";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { AppShell } from "@/components/intern/AppShell";
import {
  CpPaperArticles,
  CpPaperProjects,
  CpPersonCompetences,
} from "@/util/cockpit.generated";
import { AuthorArticleView } from "./AuthorArticleView";
import { EditorArticleView } from "./EditorArticleView";
import { getGoogleDocsCharCount } from "./getGoogleDocsCharCount";

/**
 * An article written in Google Docs. Two audiences: authors (no account,
 * shared link) get a guided checklist; the Redaktion gets status and facts,
 * and can look at the author view with `?ansicht=autor`.
 */
export async function GoogleDocArticlePage(props: {
  article: CpPaperArticles;
  project: CpPaperProjects;
  authorPreview: boolean;
}) {
  // Kick off the slow Google Docs lookup without blocking the page; the
  // counts stream into Suspense boundaries.
  const charCount = getGoogleDocsCharCount(props.article.gid);
  const person = await resolveUserFromServer();
  const isEditor = !!person?.competences.includes(CpPersonCompetences.Editor);

  return (
    <AppShell
      title="Emmausbote"
      backHref={
        isEditor
          ? Links.ProjektplattformProjekt(props.project._id)
          : Links.Hauptseite
      }
      backLabel={isEditor ? "Zurück zum Projekt" : "Zur Startseite"}
    >
      {isEditor && !props.authorPreview ? (
        <EditorArticleView
          article={props.article}
          project={props.project}
          charCount={charCount}
        />
      ) : (
        <AuthorArticleView
          article={props.article}
          project={props.project}
          charCount={charCount}
          preview={isEditor}
        />
      )}
    </AppShell>
  );
}
