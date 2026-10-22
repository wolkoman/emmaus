import { fetchMonthlyForPrint } from "@/app/monatsblatt/fetchMonthly.server";
import { EventsFlowProvider } from "@/app/monatsblatt/EventsFlow";
import { eventsSlotIds, FlyerSheet } from "@/app/monatsblatt/FlyerSheet";
import { InsertSheet } from "@/app/monatsblatt/InsertSheet";
import { LetterFlowProvider } from "@/app/monatsblatt/LetterFlow";
import { letterSlotIds } from "@/app/monatsblatt/letter";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import {
  INSERT_PANELS,
  SHEET_HEIGHT_MM,
  SHEET_WIDTH_MM,
  SHEETS,
} from "@/app/monatsblatt/fold";
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
 * Print route for the Einlage of an issue: one duplex A4 landscape sheet,
 * front and back each carrying the Einlage panel three times (InsertSheet).
 * Rendered by the same PDF job as the flyer (docs/pdf-render-jobs.md).
 *
 * Must stay publicly reachable without auth: the render pod fetches it
 * anonymously.
 */

async function InsertPrintContent(props: {
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
        @page { size: ${SHEET_WIDTH_MM}mm ${SHEET_HEIGHT_MM}mm; margin: 0; }
        html, body { margin: 0; padding: 0; }
        /* Override the variable font from the root layout. */
        body, body * { font-family: "Source Sans 3", sans-serif; }
      `}</style>
      <LetterFlowProvider
        letter={data.letter}
        slotIds={letterSlotIds(data.tiles)}
      >
        <EventsFlowProvider
          events={data.events}
          liturgies={liturgies}
          slotIds={eventsSlotIds(data.tiles)}
        >
          {/* The letter may start on a flyer panel and continue here: lay the
              flyer out invisibly (zero-height box, not display:none, so it
              still measures) and the split matches the flyer's PDF. */}
          <div style={{ height: 0, overflow: "hidden" }} aria-hidden>
            <div style={{ visibility: "hidden" }}>
              {SHEETS.map((sheet) => (
                <FlyerSheet
                  key={sheet.label}
                  sheet={sheet}
                  data={data}
                  liturgies={liturgies}
                />
              ))}
            </div>
          </div>
          {INSERT_PANELS.map((panelId, i) => (
            <div
              key={panelId}
              style={{
                width: `${SHEET_WIDTH_MM}mm`,
                height: `${SHEET_HEIGHT_MM}mm`,
                breakAfter: i < INSERT_PANELS.length - 1 ? "page" : undefined,
                overflow: "hidden",
              }}
            >
              <InsertSheet
                panelId={panelId}
                data={data}
                liturgies={liturgies}
              />
            </div>
          ))}
        </EventsFlowProvider>
      </LetterFlowProvider>
    </>
  );
}

export default function MonthlyInsertPrintPage(props: {
  params: Promise<{ name: string }>;
}) {
  // cacheComponents requires uncached data inside <Suspense>.
  return (
    <Suspense fallback={null}>
      <InsertPrintContent params={props.params} />
    </Suspense>
  );
}
