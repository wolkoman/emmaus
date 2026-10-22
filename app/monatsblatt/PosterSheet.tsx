import { EventsSlot } from "@/app/monatsblatt/EventsFlow";
import { DefaultTile, issueTitle } from "@/app/monatsblatt/FlyerSheet";
import {
  ISSUE_CONTENT_MAIL,
  issueInfo,
  TileHeading,
} from "@/app/monatsblatt/FlyerTiles";
import { MonthlyData, MonthlyTile } from "@/app/monatsblatt/editor/store";
import {
  POSTER_COLUMN_WIDTH_MM,
  POSTER_EVENTS_SLOT_IDS,
  POSTER_GAP_MM,
  POSTER_HEIGHT_MM,
  POSTER_MARGIN_MM,
  POSTER_PANELS,
  POSTER_WIDTH_MM,
  PosterPanelId,
  posterTiles,
} from "@/app/monatsblatt/poster";
import {
  FLYER_TEXT,
  POSTER_TEXT_PX_DEFAULT,
} from "@/app/monatsblatt/typography";
import { CALENDAR_INFO } from "@/domain/events/CalendarInfo";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { cn } from "@/util/utils";
import { ReactNode } from "react";

/**
 * Renders the A3 poster version of an issue (see app/monatsblatt/poster.ts):
 * one single-sided 297×420 mm page — title band, two columns, parish footer.
 * Same tiles and tile renderers as the flyer, only placed by their poster
 * placement.
 *
 * Each column leads with a static frame of the events flow, so the "Termine"
 * list starts top left and continues at the top of the right column; the
 * arrangeable tiles follow below it.
 *
 * The poster runs on a larger type scale than the flyer, chosen per issue
 * (`bodyPx`): the tiles size everything relative to the root, so this single
 * number scales the whole page (see typography.ts).
 *
 * Shared between the poster editor and its print route: the editor passes
 * `renderTile` to wrap the read-only tiles with move/hide controls and
 * `columnExtra` for per-column UI; print renders as-is.
 */

const MM = (n: number) => `${n}mm`;

function PosterHeader(props: { data: MonthlyData }) {
  const { monthWord, year, subline } = issueTitle(props.data);
  return (
    <div className="flex shrink-0 justify-between gap-6 pb-10">
      <div className="flex grow gap-4">
        <img src={CALENDAR_INFO.dot} className="w-24" alt="" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className={cn(FLYER_TEXT.heading, "normal-case")}>
            Monatsmitteilungen {monthWord} {year}
          </div>

          <div
            className={cn(
              FLYER_TEXT.title,
              "text-emmaus max-w-[120mm] leading-tight whitespace-pre-line",
            )}
          >
            {props.data.coverText}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-2">
        <div className="flex flex-col text-right">
          <div className="font-semibold">{CALENDAR_INFO.fullName}</div>
          <div>{CALENDAR_INFO.address}</div>
          <div>emmaus.wien | kanzlei@emmaus.wien</div>
          <div>IBAN: AT97 1200 0503 2479 5601</div>
        </div>
      </div>
    </div>
  );
}

function PosterFooter(props: { data: MonthlyData }) {
  const { deadline, eventsAsOf } = issueInfo(props.data);
  return (
    <div className="flex shrink-0 items-center justify-center gap-6 pt-3">
      <div className="flex flex-wrap justify-end gap-x-3 text-right opacity-70">
        <span>Beiträge an {ISSUE_CONTENT_MAIL}</span>|
        <span>Nächster Redaktionsschluss: {deadline}</span>|
        <span>Termine Stand: {eventsAsOf}</span>
      </div>
    </div>
  );
}

export function PosterSheet(props: {
  data: MonthlyData;
  liturgies: Liturgy[];
  /**
   * Clip column content to the page (print default). The editor turns this
   * off so the floating tile toolbars aren't cut off at column edges.
   */
  clip?: boolean;
  renderTile?: (tile: MonthlyTile) => ReactNode;
  columnExtra?: (panel: PosterPanelId) => ReactNode;
  /** Editor only: warn when the events list doesn't fit on the page. */
  showEventsOverflowWarning?: boolean;
  /** Base font size in px; defaults to POSTER_TEXT_PX_DEFAULT. */
  bodyPx?: number;
}) {
  const clip = props.clip ?? true;
  const renderTile =
    props.renderTile ??
    ((tile: MonthlyTile) => (
      <DefaultTile
        key={tile.id}
        tile={tile}
        data={props.data}
        liturgies={props.liturgies}
      />
    ));

  return (
    <div
      className="flex flex-col bg-white"
      style={{
        width: MM(POSTER_WIDTH_MM),
        height: MM(POSTER_HEIGHT_MM),
        padding: MM(POSTER_MARGIN_MM),
        // Inline, not a Tailwind class: the value is data, not a variant.
        fontSize: `${props.bodyPx ?? POSTER_TEXT_PX_DEFAULT}px`,
      }}
    >
      <PosterHeader data={props.data} />
      <div className="flex min-h-0 grow" style={{ gap: MM(POSTER_GAP_MM) }}>
        {POSTER_PANELS.map((column) => (
          <div
            key={column.id}
            className="group/panel relative flex h-full min-h-0 flex-col"
            style={{ width: MM(POSTER_COLUMN_WIDTH_MM) }}
          >
            <div
              className={cn(
                "flex h-full min-h-0 flex-col gap-6",
                clip && "overflow-hidden",
              )}
            >
              <EventsSlot
                id={POSTER_EVENTS_SLOT_IDS[column.id]}
                showOverflowWarning={props.showEventsOverflowWarning}
                overflowAdvice="Kacheln ausblenden oder Zeitraum kürzen"
                // The right frame stays unused when the list fits in the left
                // column; it must not push that column's tiles down.
                collapseWhenEmpty
              />
              {posterTiles(props.data.tiles, column.id).map(renderTile)}
            </div>
            {props.columnExtra && (
              <div className="absolute -bottom-3 left-1/2 z-20 -translate-x-1/2">
                {props.columnExtra(column.id)}
              </div>
            )}
          </div>
        ))}
      </div>
      <PosterFooter data={props.data} />
    </div>
  );
}
