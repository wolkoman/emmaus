import { fetchPublishedMonthly } from "@/app/monatsblatt/fetchMonthly.server";
import {
  editorialDeadline,
  ISSUE_CONTENT_MAIL,
} from "@/app/monatsblatt/FlyerTiles";
import { MonthlyWebView } from "@/app/monatsblatt/MonthlyWebView";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import { formatDate } from "@/app/(shared)/Localization";
import { NewsletterSubscribePopover } from "@/app/newsletter/NewsletterSubscribePopover";
import { loadCachedLiturgyData } from "@/domain/liturgy/liturgy-loading";
import Site from "@/components/Site";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PiFilePdf } from "react-icons/pi";

/**
 * Public Monatsblatt page: the current issue on the screen (MonthlyWebView)
 * plus the print products as PDF — the folded flyer that lies in the church
 * (with its Einlage, if the issue has one) and the A3 poster from the notice
 * board.
 *
 * Everything comes from the last "Veröffentlichen" run in the editor
 * (app/monatsblatt/editor), so the page never shows a draft.
 */

export const metadata: Metadata = {
  title: "Monatsblatt | Emmaus",
  description: "Alle Termine, Ankündigungen und Evangelien des Monats",
};

async function CurrentIssue() {
  const [issue, liturgies] = await Promise.all([
    fetchPublishedMonthly(),
    loadCachedLiturgyData(),
  ]);
  if (!issue) {
    return (
      <div className="max-w-xl opacity-70">
        Das nächste Monatsblatt wird gerade vorbereitet — Sie finden es in Kürze
        hier und in der Kirche.
      </div>
    );
  }
  const data = issue.data as MonthlyData;
  const deadline = editorialDeadline(issue.month);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <NewsletterSubscribePopover />
        {/* Downloads are links, not buttons — `nativeButton={false}` keeps
            Base UI from expecting a <button> element. */}
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={issue.flyerPdfUrl} target="_blank" />}
        >
          <PiFilePdf /> Monatsblatt (PDF)
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={issue.posterPdfUrl} target="_blank" />}
        >
          <PiFilePdf /> Plakat A3 (PDF)
        </Button>
        {issue.insertPdfUrl && (
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={issue.insertPdfUrl} target="_blank" />}
          >
            <PiFilePdf /> Einlage (PDF)
          </Button>
        )}
      </div>

      {deadline && (
        <div className="mt-4 max-w-xl text-sm text-gray-600">
          Beiträge für die nächste Ausgabe bitte bis{" "}
          {formatDate(deadline, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          an{" "}
          <a href={`mailto:${ISSUE_CONTENT_MAIL}`} className="underline">
            {ISSUE_CONTENT_MAIL}
          </a>
        </div>
      )}

      <hr className="my-8 border-black/10" />

      <MonthlyWebView data={data} liturgies={liturgies} />
    </>
  );
}

export default function MonthlyPage() {
  return (
    <Site title="Monatsblatt">
      <div className="my-6 text-4xl font-bold lg:my-12">Monatsblatt</div>
      <div className="mb-6 max-w-xl">
        Alle Gottesdienste, Termine und Ankündigungen eines Monats werden im
        Monatsblatt verlautbart. Sie finden es in der Kirche oder können es hier
        ausdrucken.
      </div>
      <Suspense fallback={null}>
        <CurrentIssue />
      </Suspense>
    </Site>
  );
}
