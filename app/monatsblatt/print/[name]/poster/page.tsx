import { EventsFlowProvider } from "@/app/monatsblatt/EventsFlow";
import { PosterSheet } from "@/app/monatsblatt/PosterSheet";
import { fetchMonthlyForPrint } from "@/app/monatsblatt/fetchMonthly.server";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import {
  POSTER_HEIGHT_MM,
  POSTER_WIDTH_MM,
  posterEventsSlotIds,
} from "@/app/monatsblatt/poster";
import { loadCachedLiturgyData } from "@/domain/liturgy/liturgy-loading";
import { notFound } from "next/navigation";
import { Suspense } from "react";
// Static (non-variable) Source Sans 3 cuts for the PDF renderer — see the
// note in the flyer print route.
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/400-italic.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";

/**
 * Print route for the A3 poster ("Plakat") of an issue — one single-sided
 * 297×420 mm page, rendered by the same PDF job as the flyer
 * (docs/pdf-render-jobs.md). Content and tiles are shared with the flyer; only
 * the poster placements decide what is shown where (app/monatsblatt/poster.ts).
 *
 * Must stay publicly reachable without auth: the render pod fetches it
 * anonymously.
 */

async function PosterPrintContent(props: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await props.params;
  const [record, liturgies] = await Promise.all([
    fetchMonthlyForPrint(decodeURIComponent(name)),
    loadCachedLiturgyData(),
  ]);
  if (!record) notFound();
  const data = record.data as MonthlyData;

  return (
    <>
      <style>{`
        @page { size: ${POSTER_WIDTH_MM}mm ${POSTER_HEIGHT_MM}mm; margin: 0; }
        html, body { margin: 0; padding: 0; }
        /* Override the variable font from the root layout. */
        body, body * { font-family: "Source Sans 3", sans-serif; }
      `}</style>
      <EventsFlowProvider
        events={data.events}
        liturgies={liturgies}
        slotIds={posterEventsSlotIds()}
      >
        <div
          style={{
            width: `${POSTER_WIDTH_MM}mm`,
            height: `${POSTER_HEIGHT_MM}mm`,
            overflow: "hidden",
          }}
        >
          <PosterSheet
            data={data}
            liturgies={liturgies}
            bodyPx={data.posterTextPx}
          />
        </div>
      </EventsFlowProvider>
    </>
  );
}

export default function MonthlyPosterPrintPage(props: {
  params: Promise<{ name: string }>;
}) {
  // cacheComponents requires uncached data inside <Suspense>.
  return (
    <Suspense fallback={null}>
      <PosterPrintContent params={props.params} />
    </Suspense>
  );
}
