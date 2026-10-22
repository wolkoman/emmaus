import { Links } from "@/app/(shared)/Links";
import { AppCard, PageHeading } from "@/components/intern/AppUI";
import { Button } from "@/components/ui/button";
import { CpPaperArticles, CpPaperProjects } from "@/util/cockpit.generated";
import { cn } from "@/util/utils";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { PiCheckCircleFill, PiPencilSimple } from "react-icons/pi";
import { articleDeadline, articleLength, isSubmitted } from "./articleInfo";
import { LengthProgress, LengthProgressShadow } from "./LengthProgress";
import { SubmitArticleButton } from "./SubmitArticleButton";

/**
 * What an author sees (no account, opened from a shared link): what to write
 * by when, and three steps — write in the Google Doc, add pictures, submit.
 */
export function AuthorArticleView(props: {
  article: CpPaperArticles;
  project: CpPaperProjects;
  charCount: Promise<number>;
  /** An editor looking at this view: no submitting, a way back. */
  preview?: boolean;
}) {
  const length = articleLength(props.article);
  const deadline = articleDeadline(props.project);
  const docUrl = `https://docs.google.com/document/d/${props.article.gid}/edit`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      {props.preview && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Vorschau: So sieht die Autorin oder der Autor diese Seite.
          <Link
            href={Links.ProjektplattformArtikel(props.article._id)}
            className="font-medium underline-offset-2 hover:underline"
          >
            Zurück zur Redaktionsansicht
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <PageHeading
          title={props.article.name}
          description={`Ihr Beitrag für den Emmausboten ${props.project.name}`}
        />
        <p className="flex flex-wrap items-center gap-2 text-sm">
          Abgabe bis <span className="font-semibold">{deadline.date}</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 font-medium",
              {
                late: "bg-red-100 text-red-700",
                soon: "bg-amber-100 text-amber-700",
                ok: "bg-green-100 text-green-700",
              }[deadline.tone],
            )}
          >
            {deadline.label}
          </span>
        </p>
      </div>

      {isSubmitted(props.article) ? (
        <AppCard className="flex flex-col items-center gap-2 p-8 text-center">
          <PiCheckCircleFill className="text-4xl text-green-600" />
          <div className="text-lg font-semibold">
            Vielen Dank für Ihren Beitrag!
          </div>
          <p className="text-black/60">
            Ihr Artikel ist eingereicht. Die Redaktion meldet sich, falls es
            Fragen gibt.
          </p>
          <a href={docUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="mt-2">
              <PiPencilSimple /> Dokument ansehen
            </Button>
          </a>
        </AppCard>
      ) : (
        <ol className="flex flex-col gap-3">
          <AuthorStep number={1} title="Schreiben">
            <p className="text-black/70">
              Schreiben Sie Ihren Beitrag direkt im Google Doc – es speichert
              automatisch. Vorgesehen ist {length.pages}.
            </p>
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start"
            >
              <Button size="lg">
                <PiPencilSimple /> Im Google Doc schreiben
              </Button>
            </a>
            <Suspense fallback={<LengthProgressShadow />}>
              {props.charCount.then((count) => (
                <LengthProgress
                  count={count}
                  min={length.min}
                  max={length.max}
                />
              ))}
            </Suspense>
          </AuthorStep>

          <AuthorStep number={2} title="Bilder hinzufügen" optional>
            <p className="text-black/70">
              Fotos oder Grafiken machen Ihren Beitrag lebendig. Laden Sie sie
              auf{" "}
              <a
                href="https://emmaus.wien/upload"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emmaus font-medium underline-offset-2 hover:underline"
              >
                emmaus.wien/upload
              </a>{" "}
              hoch.
            </p>
          </AuthorStep>

          <AuthorStep number={3} title="Einreichen">
            <p className="text-black/70">
              Wenn Ihr Text fertig ist, geben Sie der Redaktion Bescheid.
            </p>
            <Suspense
              fallback={
                <SubmitArticleButton
                  articleId={props.article._id}
                  preview={props.preview}
                />
              }
            >
              {props.charCount.then((count) => (
                <SubmitArticleButton
                  articleId={props.article._id}
                  missing={length.min - count}
                  preview={props.preview}
                />
              ))}
            </Suspense>
          </AuthorStep>
        </ol>
      )}

      <p className="text-sm text-black/50">
        Mit der Einsendung übertragen Sie uns die Veröffentlichungsrechte (mit
        Namensnennung). Ihr Text wird redaktionell bearbeitet.
      </p>
    </div>
  );
}

function AuthorStep(props: {
  number: number;
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <li>
      <AppCard className="flex gap-4 p-5">
        <div className="bg-emmaus grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white">
          {props.number}
        </div>
        <div className="flex min-w-0 grow flex-col gap-3">
          <h2 className="font-semibold">
            {props.title}
            {props.optional && (
              <span className="ml-2 text-sm font-normal text-black/50">
                optional
              </span>
            )}
          </h2>
          {props.children}
        </div>
      </AppCard>
    </li>
  );
}
