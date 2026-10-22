import { fetchMonthlyForPrint } from "@/app/monatsblatt/fetchMonthly.server";
import { EventsFlowProvider } from "@/app/monatsblatt/EventsFlow";
import { LetterFlowProvider } from "@/app/monatsblatt/LetterFlow";
import { letterSlotIds } from "@/app/monatsblatt/letter";
import { eventsSlotIds, FlyerSheet } from "@/app/monatsblatt/FlyerSheet";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import {
  SHEET_HEIGHT_MM,
  SHEET_WIDTH_MM,
  SHEETS,
} from "@/app/monatsblatt/fold";
import { loadCachedLiturgyData } from "@/domain/liturgy/liturgy-loading";
import { notFound } from "next/navigation";
import { Suspense } from "react";
// Static (non-variable) Source Sans 3 cuts for the PDF renderer: Chromium
// converts VARIABLE fonts to Type3 path glyphs in page.pdf(), which makes
// the PDF laggy in viewers and text non-searchable. With static cuts it
// embeds proper subsetted TrueType fonts. Same metrics as the site font.
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/400-italic.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";

/**
 * Print route for the Monatsblatt flyer — the page the PDF render job
 * (docs/pdf-render-jobs.md) fetches with headless Chromium. Renders the two
 * physical sheet sides (Außen/Innen) as exact 297×210 mm pages with zero
 * margin; the imposition (panel order, fold-in panel width) comes from
 * fold.ts.
 *
 * Must stay publicly reachable without auth: the render pod fetches it
 * anonymously. Content is announcements/events, i.e. public anyway.
 */

async function PrintContent(props: { params: Promise<{ name: string }> }) {
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
        /* Override the variable font from the root layout (see import note). */
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
          {SHEETS.map((sheet, i) => (
            <div
              key={sheet.label}
              style={{
                width: `${SHEET_WIDTH_MM}mm`,
                height: `${SHEET_HEIGHT_MM}mm`,
                // Page break between sheets only — a break after the last one
                // would add a blank third PDF page.
                breakAfter: i < SHEETS.length - 1 ? "page" : undefined,
                overflow: "hidden",
              }}
            >
              <FlyerSheet sheet={sheet} data={data} liturgies={liturgies} />
            </div>
          ))}
        </EventsFlowProvider>
      </LetterFlowProvider>
    </>
  );
}

export default function MonthlyPrintPage(props: {
  params: Promise<{ name: string }>;
}) {
  // cacheComponents requires uncached data inside <Suspense>. The render job
  // waits for network idle + document.fonts.ready, so streaming is fine.
  return (
    <Suspense fallback={null}>
      <PrintContent params={props.params} />
    </Suspense>
  );
}
