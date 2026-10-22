import { Links } from "@/app/(shared)/Links";
import { CopyArticleLinkButton } from "@/app/redaktion/CopyArticleLinkButton";
import { AppCard, AppFact, PageHeading } from "@/components/intern/AppUI";
import { Button } from "@/components/ui/button";
import { CpPaperArticles, CpPaperProjects } from "@/util/cockpit.generated";
import Link from "next/link";
import { Suspense } from "react";
import { PiEye, PiPencilSimple } from "react-icons/pi";
import { articleDeadline, articleLength } from "./articleInfo";
import { ArticleStatusSwitch } from "./ArticleStatusSwitch";
import { LengthProgress, LengthProgressShadow } from "./LengthProgress";

/** What the Redaktion sees: status, length and deadline at a glance. */
export function EditorArticleView(props: {
  article: CpPaperArticles;
  project: CpPaperProjects;
  charCount: Promise<number>;
}) {
  const length = articleLength(props.article);
  const deadline = articleDeadline(props.project);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title={props.article.name}
          description={`${props.project.name} · ${length.pages}`}
        />
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://docs.google.com/document/d/${props.article.gid}/edit`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>
              <PiPencilSimple /> Google Doc öffnen
            </Button>
          </a>
          <CopyArticleLinkButton
            articleId={props.article._id}
            label="Link für Autor:in kopieren"
          />
        </div>
      </div>

      <AppCard className="flex flex-col divide-y divide-neutral-100 px-6">
        <AppFact label="Status">
          <ArticleStatusSwitch
            articleId={props.article._id}
            initialStatus={props.article.status}
          />
        </AppFact>
        <AppFact label="Autor:in">{props.article.author}</AppFact>
        <AppFact label="Länge">
          <span className="block w-80 max-w-full font-normal">
            <Suspense fallback={<LengthProgressShadow />}>
              {props.charCount.then((count) => (
                <LengthProgress
                  count={count}
                  min={length.min}
                  max={length.max}
                />
              ))}
            </Suspense>
          </span>
        </AppFact>
        <AppFact label="Abgabe">
          {deadline.date}{" "}
          <span className="font-normal text-black/60">({deadline.label})</span>
        </AppFact>
      </AppCard>

      <Link
        href={`${Links.ProjektplattformArtikel(props.article._id)}?ansicht=autor`}
        className="flex items-center gap-1.5 self-start text-sm text-black/60 hover:text-black"
      >
        <PiEye /> Ansicht für Autor:in
      </Link>
    </div>
  );
}
