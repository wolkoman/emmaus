import { SHEET_HEIGHT_MM, SHEET_WIDTH_MM } from "@/app/monatsblatt/fold";
import type { MonthlyTile } from "@/app/monatsblatt/editor/store";
import { LETTER_TITLE, letterSlotIds } from "@/app/monatsblatt/letter";

/**
 * "Plakat": a single-sided A3 portrait version of the Monatsmitteilungen for
 * the notice board — same issue, same tiles, two tall columns instead of the
 * six folded flyer panels (app/monatsblatt/fold.ts).
 *
 * There is no second copy of the content: every tile carries an ADDITIONAL
 * poster placement (column + order + visibility) next to its flyer position,
 * so the poster can reorder or drop tiles without touching the flyer, and
 * editing text in the flyer editor updates both.
 *
 * Tiles saved before the poster existed have no placement yet;
 * `posterPlacement()` derives a deterministic default from the flyer position,
 * and the first move/hide in the poster editor materializes it.
 */

export const POSTER_WIDTH_MM = 297;
export const POSTER_HEIGHT_MM = 420;
/** Outer margin — beyond the unprintable border of office printers. */
export const POSTER_MARGIN_MM = 12;
/** Gutter between the two columns. */
export const POSTER_GAP_MM = 12;

export const POSTER_COLUMN_WIDTH_MM =
  (POSTER_WIDTH_MM - 2 * POSTER_MARGIN_MM - POSTER_GAP_MM) / 2;

/** Poster columns, left → right (the poster's "panels"). */
export type PosterPanelId = 0 | 1;

export const POSTER_PANELS: { id: PosterPanelId; label: string }[] = [
  { id: 0, label: "Linke Spalte" },
  { id: 1, label: "Rechte Spalte" },
];

/**
 * The poster's events frames are STATIC: one per column, always present, and
 * chained left → right so the "Termine" list flows from the left column into
 * the right one. They are not tiles — the flyer's EVENTS tiles are its own
 * continuation frames (one per flyer panel) and are therefore not shown on the
 * poster: there is nothing to arrange, and the poster editor could not insert
 * additional frames anyway.
 */
export const POSTER_EVENTS_SLOT_IDS: Record<PosterPanelId, string> = {
  0: "poster-events-0",
  1: "poster-events-1",
};

/** Slot chain of the events flow on the poster, in reading order. */
export function posterEventsSlotIds(): string[] {
  return POSTER_PANELS.map(({ id }) => POSTER_EVENTS_SLOT_IDS[id]);
}

/**
 * Tiles the poster can place; EVENTS frames are flyer-only (see above). The
 * letter shows in one piece, so only its first LETTER frame takes part.
 */
function posterTileFilter(tiles: MonthlyTile[]) {
  const firstLetter = letterSlotIds(tiles)[0];
  return (tile: MonthlyTile) =>
    tile.type !== "EVENTS" &&
    (tile.type !== "LETTER" || tile.id === firstLetter);
}

export type PosterPlacement = {
  panel: PosterPanelId;
  order: number;
  /**
   * Poster-only visibility. Hidden tiles keep their place in the column order
   * (so unhiding restores it) and are untouched in the flyer.
   */
  isVisible: boolean;
};

/** Poster placement of a tile, with the default for untouched tiles. */
export function posterPlacement(tile: MonthlyTile): PosterPlacement {
  return (
    tile.poster ?? {
      // Inside panels into the left column, back/fold-in panels into the
      // right one; flyer reading order is preserved within each column.
      panel: tile.position.panel <= 2 ? 0 : 1,
      order: tile.position.panel * 1000 + tile.position.order,
      isVisible: true,
    }
  );
}

/** All tiles of one column in order, hidden ones included. */
export function posterColumnTiles(
  tiles: MonthlyTile[],
  panel: PosterPanelId,
): MonthlyTile[] {
  const isPosterTile = posterTileFilter(tiles);
  return tiles
    .filter(
      (tile) => isPosterTile(tile) && posterPlacement(tile).panel === panel,
    )
    .sort((a, b) => posterPlacement(a).order - posterPlacement(b).order);
}

/** What the poster actually shows in one column. */
export function posterTiles(
  tiles: MonthlyTile[],
  panel: PosterPanelId,
): MonthlyTile[] {
  return posterColumnTiles(tiles, panel).filter(
    (tile) => posterPlacement(tile).isVisible,
  );
}

/** Tiles dropped from the poster — the editor's "wieder einblenden" tray. */
export function posterHiddenTiles(tiles: MonthlyTile[]): MonthlyTile[] {
  const isPosterTile = posterTileFilter(tiles);
  return tiles.filter(
    (tile) => isPosterTile(tile) && !posterPlacement(tile).isVisible,
  );
}

/** Human label of a tile, for the poster editor's controls. */
export function tileLabel(tile: MonthlyTile): string {
  switch (tile.type) {
    case "ARTICLE":
      return tile.title || "Ankündigung";
    case "EVENTS":
      return "Termine";
    case "EVANGELIEN":
      return "Evangelien";
    case "GEBETSANLIEGEN":
      return "Gebetsanliegen";
    case "INSTAGRAM":
      return "Instagram";
    case "CROSSWORD":
      return "Kreuzworträtsel";
    case "IMAGE":
      return "Bild";
    case "LETTER":
      return LETTER_TITLE;
  }
}

/** The printable layouts of one issue; "insert" only with an Einlage. */
export type MonthlyLayout = "flyer" | "poster" | "insert";

/**
 * Print route and paper size per layout — the PDF render job needs both
 * (docs/pdf-render-jobs.md), and they must never drift apart.
 */
export function layoutPrintJob(layout: MonthlyLayout, name: string) {
  const path = `/monatsblatt/print/${encodeURIComponent(name)}`;
  if (layout === "poster") {
    return {
      path: `${path}/poster`,
      widthMm: POSTER_WIDTH_MM,
      heightMm: POSTER_HEIGHT_MM,
    };
  }
  return {
    path: layout === "insert" ? `${path}/einlage` : path,
    widthMm: SHEET_WIDTH_MM,
    heightMm: SHEET_HEIGHT_MM,
  };
}
