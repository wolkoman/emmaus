import { Links } from "@/app/(shared)/Links";
import { formatDate } from "@/app/(shared)/Localization";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { extractArticleLength } from "@/app/redaktion/artikel/[articleId]/Format";
import { AppShell } from "@/components/intern/AppShell";
import { AppCard, PageHeading } from "@/components/intern/AppUI";
import { Button } from "@/components/ui/button";
import {
  CpPaperArticles,
  CpPaperProjects,
  CpPaperTexts,
  CpPersonCompetences,
} from "@/util/cockpit.generated";
import Link from "next/link";
import { PiClockClockwise } from "react-icons/pi";

/**
 * Articles written in the former built-in editor (no Google Doc): shown
 * read-only. New articles are written in Google Docs (UpdateArticleClient).
 */
export async function ArticleReadOnlyPage(props: {
  article: CpPaperArticles;
  project: CpPaperProjects;
  version?: CpPaperTexts;
}) {
  const person = await resolveUserFromServer();
  const isEditor = !!person?.competences.includes(CpPersonCompetences.Editor);
  const text = props.version?.text ?? "";
  const [minLength, maxLength] = extractArticleLength(props.article);

  return (
    <AppShell
      title="Emmausbote"
      // Authors open this page from a shared link without an account.
      backHref={
        isEditor
          ? Links.ProjektplattformProjekt(props.project._id)
          : Links.Hauptseite
      }
      backLabel={isEditor ? "Zurück zum Projekt" : "Zur Startseite"}
      actions={
        isEditor && (
          <Link href={Links.ProjektplattformVersion(props.article._id)}>
            <Button variant="outline">
              <PiClockClockwise /> Versionen
            </Button>
          </Link>
        )
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <PageHeading
          title={props.article.name}
          description={
            <>
              {props.article.author} · {props.project.name} · Redaktionsschluss{" "}
              {formatDate(props.project.deadline, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </>
          }
        />

        <AppCard className="p-6 text-lg whitespace-pre-wrap sm:p-10">
          {text || <span className="text-black/40">Noch kein Text.</span>}
        </AppCard>

        <p className="text-sm text-black/60">
          {text.length} Zeichen (vorgesehen: {minLength}–{maxLength})
        </p>
      </div>
    </AppShell>
  );
}
