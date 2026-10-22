/**
 * Fold geometry for the Monatsmitteilungen flyer: A4 landscape (297×210 mm)
 * with a 6-panel Wickelfalz (roll fold). Single source of truth for panel
 * sizes and imposition — the editor preview and the print route both build
 * their layout from these constants, so what the editor shows is exactly
 * what the PDF renders.
 *
 * Wickelfalz: the right third folds in first, then the cover folds over it.
 * The panel that folds INSIDE must be ~3 mm narrower (97 mm vs 100 mm),
 * otherwise the fold buckles. This matches standard print-shop specs
 * (e.g. "Wickelfalz 6-seitig DIN lang").
 *
 * Panels in READING order (what the editor shows):
 *
 *   0 Titelseite        100 mm
 *   1 Innen links       100 mm
 *   2 Innen Mitte       100 mm
 *   3 Innen rechts       97 mm  (Einklapper, inner face)
 *   4 Rückseite         100 mm
 *   5 Einklapper außen   97 mm  (outer face of the fold-in panel,
 *                                visible when the cover is first opened)
 *
 * Imposition (physical sheet sides, left → right):
 *
 *   Sheet 1 "Außenseite":  [5: 97mm] [4: 100mm] [0: 100mm]
 *   Sheet 2 "Innenseite":  [1: 100mm] [2: 100mm] [3: 97mm]
 *
 * Optional Einlage (per issue, `MonthlyData.hasInsert`): a loose leaf laid
 * into the fold, two more panels (6 front, 7 back). Printed as its own
 * duplex A4 sheet with three copies side by side, cut into strips; see
 * INSERT_* below.
 */

export const SHEET_WIDTH_MM = 297;
export const SHEET_HEIGHT_MM = 210;

/**
 * The Einlage is cut narrower than the 97 mm fold-in panel it lies in, so it
 * neither sticks out nor buckles when the flyer is closed.
 */
export const INSERT_WIDTH_MM = 95;

export type PanelId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const PANELS: { id: PanelId; label: string; widthMm: number }[] = [
  { id: 0, label: "Titelseite", widthMm: 100 },
  { id: 1, label: "Innen links", widthMm: 100 },
  { id: 2, label: "Innen Mitte", widthMm: 100 },
  { id: 3, label: "Innen rechts (Einklapper)", widthMm: 97 },
  { id: 4, label: "Rückseite", widthMm: 100 },
  { id: 5, label: "Einklapper außen", widthMm: 97 },
  { id: 6, label: "Einlage vorne", widthMm: INSERT_WIDTH_MM },
  { id: 7, label: "Einlage hinten", widthMm: INSERT_WIDTH_MM },
];

/**
 * Back panel of the folded flyer — carries the mandatory issue information
 * (editorial deadline, contact, event list "Stand"; see IssueInfoView).
 */
export const BACK_PANEL: PanelId = 4;

/** Physical PDF pages: panel IDs left → right per sheet side. */
export const SHEETS: { label: string; panels: PanelId[] }[] = [
  { label: "Außenseite", panels: [5, 4, 0] },
  { label: "Innenseite", panels: [1, 2, 3] },
];

/** The first fold runs along this panel's left edge. */
const FIRST_FOLD_PANEL: PanelId = 2;

/**
 * Where to print fold marks on a sheet side: only the first fold, and so
 * only on the Innenseite — the side facing up while folding. The second
 * fold needs no mark, it runs along the paper edge the first one created.
 * Derived from the panel widths, so marks can never drift away from the
 * actual layout.
 */
export function foldMarkOffsetsMm(panels: PanelId[]): number[] {
  const index = panels.indexOf(FIRST_FOLD_PANEL);
  if (index < 1) return [];
  let x = 0;
  for (const id of panels.slice(0, index)) x += panelById(id).widthMm;
  return [x];
}

export function panelById(id: PanelId) {
  const panel = PANELS.find((p) => p.id === id);
  if (!panel) throw new Error(`Unknown panel ${id}`);
  return panel;
}

/** Panels that can contain movable content tiles, in reading order. */
export const CONTENT_PANEL_ORDER: PanelId[] = [1, 2, 3, 4, 5, 6, 7];

/** Einlage panels: front and back of the loose leaf. */
export const INSERT_PANELS: PanelId[] = [6, 7];

export function isInsertPanel(id: PanelId): boolean {
  return INSERT_PANELS.includes(id);
}

/** Content panels of an issue, without the Einlage unless it is enabled. */
export function contentPanels(hasInsert: boolean): PanelId[] {
  return CONTENT_PANEL_ORDER.filter((id) => hasInsert || !isInsertPanel(id));
}

/** Copies of the Einlage per A4 sheet. */
export const INSERT_COPIES = 3;
/**
 * Offcut at the left and right sheet edge. Equal on both sides, so the copies
 * of front and back line up regardless of how the printer flips the sheet.
 */
export const INSERT_OFFCUT_MM =
  (SHEET_WIDTH_MM - INSERT_COPIES * INSERT_WIDTH_MM) / 2;

/** Where the cuts run on an Einlage sheet: both edges of every copy. */
export function insertCutOffsetsMm(): number[] {
  return Array.from(
    { length: INSERT_COPIES + 1 },
    (_, i) => INSERT_OFFCUT_MM + i * INSERT_WIDTH_MM,
  );
}
