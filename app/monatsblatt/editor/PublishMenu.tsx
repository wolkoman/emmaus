"use client";

import { pollPdfRender } from "@/app/(domain)/render/render-actions";
import type { MonthlyPublication } from "@/app/(domain)/monthly/monthly-repo";
import {
  completeMonthlyPublication,
  fetchMonthlyPublication,
  startMonthlyRenders,
} from "@/app/monatsblatt/editor/actions";
import { useMonthlyEditorStore } from "@/app/monatsblatt/editor/store";
import { layoutPrintJob } from "@/app/monatsblatt/poster";
import { MENUBAR_TRIGGER } from "@/app/monatsblatt/editor/IssueMenu";
import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewsletterDialog } from "@/app/monatsblatt/editor/NewsletterDialog";
import {
  PiCheck,
  PiFilePdf,
  PiMailbox,
  PiUploadSimple,
  PiWarning,
} from "react-icons/pi";
import { RiLoader4Fill } from "react-icons/ri";

/**
 * Publishing of a Monatsblatt issue ("Veröffentlichen" menu). It runs:
 *
 *   1. save the issue (the render pods fetch the print routes, so the state
 *      must be in Pocketbase first),
 *   2. render all layouts (flyer, A3 poster, Einlage if any) as PDFs,
 *   3. store the links and the generation date on the issue's row.
 *
 * Step 3 only runs when all renders succeeded, so a half-published issue can
 * never exist: a failed run keeps the previous PDFs and date. Polling happens
 * here rather than in a server action because a render takes tens of seconds
 * (docs/pdf-render-jobs.md).
 */

const RENDER_TIMEOUT_MS = 4 * 60_000;
const POLL_INTERVAL_MS = 3000;

async function awaitRender(id: string): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < RENDER_TIMEOUT_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const record = await pollPdfRender(id);
    if (record.status === "done") return record.pdfUrl;
    if (record.status === "error") {
      throw new Error(record.error || "Rendern fehlgeschlagen");
    }
  }
  throw new Error("Zeitüberschreitung beim Rendern");
}

export type Publication = ReturnType<typeof usePublication>;

/** Publication state of the open issue, shared by the menu and the status. */
export function usePublication() {
  const store = useMonthlyEditorStore();
  const [state, setState] = useState<
    | { phase: "idle" }
    | { phase: "working"; label: string }
    | { phase: "error"; message: string }
  >({ phase: "idle" });
  const [published, setPublished] = useState<MonthlyPublication | null>(null);
  const busy = useRef(false);

  // Links of the last run, so they survive a reload / version switch.
  useEffect(() => {
    setPublished(null);
    if (!store.name) return;
    let active = true;
    fetchMonthlyPublication(store.name)
      .then((publication) => {
        if (active && publication?.publishedAt) setPublished(publication);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [store.name]);

  async function publish() {
    if (busy.current || !store.name) return;
    busy.current = true;
    try {
      setState({ phase: "working", label: "Speichern…" });
      await store.save();

      setState({ phase: "working", label: "PDFs werden erstellt…" });
      const { flyer, poster, insert } = await startMonthlyRenders(
        store.name,
        !!store.hasInsert,
      );
      const [flyerPdfUrl, posterPdfUrl, insertPdfUrl] = await Promise.all([
        awaitRender(flyer.id),
        awaitRender(poster.id),
        insert ? awaitRender(insert.id) : "",
      ]);

      setState({ phase: "working", label: "Veröffentlichen…" });
      setPublished(
        await completeMonthlyPublication(store.name, {
          flyerPdfUrl,
          posterPdfUrl,
          insertPdfUrl,
        }),
      );
      setState({ phase: "idle" });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      busy.current = false;
    }
  }

  return { state, published, publish };
}

function formatPublishedAt(publishedAt: string): string {
  return new Date(publishedAt).toLocaleString("de-AT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Veröffentlichen" entry of the editor's menu bar (next to "Datei"). */
export function PublishMenu(props: { publication: Publication }) {
  const store = useMonthlyEditorStore();
  const { state, published, publish } = props.publication;
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={!store.name}
          render={<button className={MENUBAR_TRIGGER} />}
        >
          Veröffentlichen
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuItem
            disabled={state.phase === "working"}
            onClick={publish}
          >
            <PiUploadSimple />
            <div className="flex flex-col">
              Jetzt veröffentlichen
              <span className="text-xs text-black/50">
                {store.hasInsert
                  ? "Speichert und erstellt Flyer-, Plakat- und Einlage-PDF"
                  : "Speichert und erstellt Flyer- und Plakat-PDF"}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNewsletterOpen(true)}>
            <PiMailbox /> Newsletter versenden …
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!published}
            onClick={() => window.open(published?.flyerPdfUrl, "_blank")}
          >
            <PiFilePdf /> Flyer-PDF öffnen
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!published}
            onClick={() => window.open(published?.posterPdfUrl, "_blank")}
          >
            <PiFilePdf /> Plakat-PDF öffnen
          </DropdownMenuItem>
          {published?.insertPdfUrl && (
            <DropdownMenuItem
              onClick={() => window.open(published.insertPdfUrl, "_blank")}
            >
              <PiFilePdf /> Einlage-PDF öffnen
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <NewsletterDialog
        open={newsletterOpen}
        onOpenChange={setNewsletterOpen}
      />
    </>
  );
}

/** Right side of the header: what happened to the issue, never an action. */
export function PublicationStatus(props: { publication: Publication }) {
  const store = useMonthlyEditorStore();
  const { state, published } = props.publication;
  if (!store.name) return null;

  return (
    <div className="relative text-xs text-black/60">
      {state.phase === "working" ? (
        <span className="flex items-center gap-1.5">
          <RiLoader4Fill className="animate-spin" /> {state.label}
        </span>
      ) : state.phase === "error" ? (
        <span className="flex items-center gap-1.5 text-red-700">
          <PiWarning /> Veröffentlichen fehlgeschlagen
        </span>
      ) : published ? (
        <span className="flex items-center gap-1.5">
          <PiCheck className="text-emmaus" /> Veröffentlicht am{" "}
          {formatPublishedAt(published.publishedAt)}
        </span>
      ) : (
        "Noch nicht veröffentlicht"
      )}

      {state.phase === "error" && (
        <div className="absolute top-full right-0 z-50 mt-3 flex w-80 flex-col items-start gap-1 rounded-md border border-red-200 bg-red-50 p-2 text-red-800">
          {state.message}
          <div className="flex gap-3">
            {(
              [
                ["flyer", "Flyer"],
                ["poster", "Plakat"],
                ...(store.hasInsert ? [["insert", "Einlage"] as const] : []),
              ] as const
            ).map(([layout, label]) => (
              <a
                key={layout}
                href={layoutPrintJob(layout, store.name).path}
                target="_blank"
                className="underline"
              >
                Druckansicht {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
