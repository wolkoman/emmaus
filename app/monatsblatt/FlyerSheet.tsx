import { EventsSlot } from "@/app/monatsblatt/EventsFlow";
import { LetterSlot } from "@/app/monatsblatt/LetterFlow";
import { letterSlotIds } from "@/app/monatsblatt/letter";
import {
  ArticleView,
  CrosswordView,
  EvangelienView,
  ImageView,
  InstagramView,
  IssueInfoView,
  PapalIntentionView,
  TileHeading,
} from "@/app/monatsblatt/FlyerTiles";
import { MonthlyData, MonthlyTile } from "@/app/monatsblatt/editor/store";
import {
  BACK_PANEL,
  foldMarkOffsetsMm,
  isInsertPanel,
  panelById,
  PanelId,
  SHEET_HEIGHT_MM,
  SHEET_WIDTH_MM,
  SHEETS,
} from "@/app/monatsblatt/fold";
import { FLYER_TEXT } from "@/app/monatsblatt/typography";
import { formatDate } from "@/app/(shared)/Localization";
import { CALENDAR_INFO } from "@/domain/events/CalendarInfo";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { cn } from "@/util/utils";
import { ReactNode } from "react";

/**
 * Renders one physical sheet side (297×210 mm) of the Monatsblatt flyer with
 * its three panels in imposition order (see fold.ts). Shared between the
 * editor preview and the print route — the editor passes `renderTile` to
 * swap the read-only tiles for interactive ones and `panelExtra` to append
 * per-panel controls; print renders as-is.
 */

const MM = (n: number) => `${n}mm`;

/**
 * Printed fold and cut marks: a short tick at the top and bottom edge.
 * Kept 5 mm clear of the sheet edge (many printers can't put ink there, and
 * a trim of a millimetre or two must not eat the mark) and stopping short of
 * the 8 mm content margin, so the tick lives entirely in the outer margin.
 */
const FOLD_MARK_INSET_MM = 5;
const FOLD_MARK_LENGTH_MM = 2;

export function tilesForPanel(
  tiles: MonthlyTile[],
  panel: PanelId,
): MonthlyTile[] {
  return tiles
    .filter((t) => t.position.panel === panel)
    .sort((a, b) => a.position.order - b.position.order);
}

/**
 * EVENTS tile IDs in reading order — the slot chain of the events flow.
 * Never on the Einlage: a loose leaf can fall out, the list must not.
 * Lives here (server-safe module) so both the print route (server) and the
 * editor (client) can compute it.
 */
export function eventsSlotIds(tiles: MonthlyTile[]): string[] {
  return tiles
    .filter(
      (t) =>
        t.type === "EVENTS" &&
        t.position.panel !== 0 &&
        !isInsertPanel(t.position.panel),
    )
    .sort(
      (a, b) =>
        a.position.panel - b.position.panel ||
        a.position.order - b.position.order,
    )
    .map((t) => t.id);
}

/**
 * Issue title parts, shared by the flyer cover and the A3 poster header:
 * hero month word ("August") plus the covered date span as a subline.
 * Falls back gracefully while no month is set.
 */
export function issueTitle(data: MonthlyData): {
  monthWord: string;
  subline: string;
  year: string;
} {
  const { month, name, dateRange } = data;
  return {
    monthWord: month
      ? new Date(month + "-01T02:00").toLocaleDateString("de-AT", {
          month: "long",
        })
      : name || "Monat wählen",
    year: month
      ? new Date(month + "-01T02:00").toLocaleDateString("de-AT", {
          year: "numeric",
        })
      : name || "Jahr wählen",
    subline:
      (dateRange.start && dateRange.end
        ? `${formatDate(dateRange.start, { day: "numeric", month: "long" })} – ${formatDate(dateRange.end, { day: "numeric", month: "long" })}`
        : "") +
      " " +
      (month ? month.slice(0, 4) : ""),
  };
}

/**
 * Cover panel. Deliberately quiet: everything is body-black except the month
 * hero; the editorial cover line is the single color accent on the page.
 * The editor passes `coverTextSlot` to swap the printed line for an input.
 */
function TitleBlock(props: { data: MonthlyData; coverTextSlot?: ReactNode }) {
  const { monthWord, subline, year } = issueTitle(props.data);

  return (
    <div className="flex h-full flex-col">
      <div className="mt-12">
        {/* Editor swaps this for a textarea; print gets the plain line. */}
        {props.coverTextSlot ?? (
          <div
            className={cn(
              FLYER_TEXT.title,
              "text-emmaus text-center leading-tight whitespace-pre-line",
            )}
          >
            {props.data.coverText}
          </div>
        )}
      </div>

      <div className="flex min-h-0 grow items-end justify-center">
        <img
          src="/tower.png"
          alt=""
          className="max-h-full w-auto"
          style={{ height: "110mm" }}
        />
      </div>

      <div className="-mt-16 mb-12 flex flex-col gap-1">
        <div className={cn(FLYER_TEXT.heading, "text-center")}>
          Monatsmitteilungen
        </div>
        <div className="text-center text-4xl font-semibold tracking-tight">
          {monthWord} {year}
        </div>

        <div className={cn(FLYER_TEXT.heading, "text-center normal-case")}>
          {subline}
        </div>
      </div>

      <div className="flex items-start gap-2 leading-4">
        <img src={CALENDAR_INFO.dot} className="my-1 w-6" alt="" />
        <div>
          <div className="font-semibold">{CALENDAR_INFO.fullName}</div>
          <div>{CALENDAR_INFO.address}</div>
          <div>emmaus.wien | kanzlei@emmaus.wien</div>
          <div>IBAN: AT97 1200 0503 2479 5601</div>
        </div>
      </div>
    </div>
  );
}

export function DefaultTile(props: {
  tile: MonthlyTile;
  data: MonthlyData;
  liturgies: Liturgy[];
}) {
  if (props.tile.type === "ARTICLE")
    return (
      <ArticleView
        title={props.tile.title}
        text={props.tile.text}
        icon={props.tile.icon}
      />
    );
  if (props.tile.type === "EVANGELIEN")
    return (
      <EvangelienView events={props.data.events} liturgies={props.liturgies} />
    );
  if (props.tile.type === "GEBETSANLIEGEN")
    return (
      <PapalIntentionView
        intention={props.data.papalIntention ?? null}
        month={props.data.name}
      />
    );
  if (props.tile.type === "INSTAGRAM") return <InstagramView />;
  if (props.tile.type === "CROSSWORD")
    return <CrosswordView words={props.tile.words} />;
  if (props.tile.type === "IMAGE")
    return <ImageView url={props.tile.url} heightMm={props.tile.heightMm} />;
  if (props.tile.type === "LETTER")
    return (
      <LetterSlot
        id={props.tile.id}
        letter={props.data.letter}
        isFirst={letterSlotIds(props.data.tiles)[0] === props.tile.id}
      />
    );
  // EVENTS tiles are linked frames of the events flow; content distribution
  // happens in EventsFlowProvider (must wrap the sheets).
  return <EventsSlot id={props.tile.id} collapseWhenEmpty />;
}

type TileRenderer = (tile: MonthlyTile) => ReactNode;

/**
 * One panel: safe area with the panel's tiles (or the cover), plus optional
 * editor controls. `padding` is the safe area, which depends on where the
 * panel sits on its sheet (paper edge, fold or cut).
 */
export function FlyerPanel(props: {
  panelId: PanelId;
  data: MonthlyData;
  liturgies: Liturgy[];
  padding: string;
  clip: boolean;
  className?: string;
  renderTile?: TileRenderer;
  panelExtra?: (panel: PanelId) => ReactNode;
  coverTextSlot?: ReactNode;
}) {
  const { panelId } = props;
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
      className={cn(
        "group/panel relative flex h-full shrink-0 flex-col",
        props.className,
      )}
      style={{ width: MM(panelById(panelId).widthMm) }}
    >
      <div
        className={cn(
          "flex h-full flex-col gap-6",
          props.clip && "overflow-hidden",
        )}
        style={{ padding: props.padding }}
      >
        {panelId === 0 && (
          <TitleBlock data={props.data} coverTextSlot={props.coverTextSlot} />
        )}
        {panelId !== 0 &&
          tilesForPanel(props.data.tiles, panelId).map(renderTile)}
        {/* Mandatory issue information, pinned to the foot of the
            Rückseite. Deliberately not a tile — it must be on every
            issue and is therefore not the editor's to move or delete.
            Being part of the flow, the events measurement accounts for
            it automatically. */}
        {panelId === BACK_PANEL && (
          <div className="mt-auto">
            <IssueInfoView data={props.data} />
          </div>
        )}
      </div>
      {/* Editor-only panel controls live OUTSIDE the padded flex
          container (absolutely positioned over the bottom margin):
          anything in the flow would shrink the space the events-flow
          measurement sees — the editor preview would then disagree
          with the print render about what fits on a panel. */}
      {props.panelExtra && (
        <div className="absolute bottom-[1.5mm] left-1/2 z-20 -translate-x-1/2">
          {props.panelExtra(panelId)}
        </div>
      )}
    </div>
  );
}

/** Printed guide ticks at the top and bottom sheet edge (folds, cuts). */
export function EdgeMarks(props: { offsetsMm: number[] }) {
  return props.offsetsMm.flatMap((offsetMm) =>
    (["top", "bottom"] as const).map((edge) => (
      <div
        key={`${offsetMm}-${edge}`}
        aria-hidden
        className="pointer-events-none absolute border-l border-black/25"
        style={{
          left: MM(offsetMm),
          height: MM(FOLD_MARK_LENGTH_MM),
          ...(edge === "top"
            ? { top: MM(FOLD_MARK_INSET_MM) }
            : { bottom: MM(FOLD_MARK_INSET_MM) }),
        }}
      />
    )),
  );
}

export function FlyerSheet(props: {
  sheet: (typeof SHEETS)[number];
  data: MonthlyData;
  liturgies: Liturgy[];
  showFoldMarks?: boolean;
  /**
   * Clip panel content to the safe area (print default). The editor turns
   * this off so the floating tile toolbar isn't cut off at panel edges.
   */
  clip?: boolean;
  renderTile?: TileRenderer;
  panelExtra?: (panel: PanelId) => ReactNode;
  /** Editor: replaces the printed cover line with an editable input. */
  coverTextSlot?: ReactNode;
}) {
  return (
    <div
      className={cn("relative flex bg-white", FLYER_TEXT.body)}
      style={{ width: MM(SHEET_WIDTH_MM), height: MM(SHEET_HEIGHT_MM) }}
    >
      {props.sheet.panels.map((panelId, i) => (
        <FlyerPanel
          key={panelId}
          panelId={panelId}
          data={props.data}
          liturgies={props.liturgies}
          // Safe area: 8mm outer margin, 6mm toward folds.
          padding={`8mm ${i === 2 ? "8mm" : "6mm"} 8mm ${i === 0 ? "8mm" : "6mm"}`}
          clip={props.clip ?? true}
          className={cn(
            i > 0 && props.showFoldMarks && "border-l border-dashed",
            i > 0 && "border-l border-black/10 print:border-black/0",
          )}
          renderTile={props.renderTile}
          panelExtra={props.panelExtra}
          coverTextSlot={props.coverTextSlot}
        />
      ))}
      {/* Fold marks: short ticks near the top and bottom edge, exactly on the
          first fold's crease (see foldMarkOffsetsMm). Printed (not
          editor-only) — they are the guide for whoever folds the stack. */}
      <EdgeMarks offsetsMm={foldMarkOffsetsMm(props.sheet.panels)} />
    </div>
  );
}
