import type {
  MonthlyArticle,
  MonthlyTile,
} from "@/app/monatsblatt/editor/store";
import { CONTENT_PANEL_ORDER } from "@/app/monatsblatt/fold";
import { letterSlotIds } from "@/app/monatsblatt/letter";

/**
 * Which parts of an issue go to a screen, shared by the web view
 * (MonthlyWebView) and the newsletter (editor/mail/monatsmitteilungen.ts) so
 * both show the same thing.
 */

/** Tiles in flyer reading order (panels 1…7; the cover carries no tiles). */
export function tilesInReadingOrder(tiles: MonthlyTile[]): MonthlyTile[] {
  return CONTENT_PANEL_ORDER.flatMap((panel) =>
    tiles
      .filter((tile) => tile.position.panel === panel)
      .sort((a, b) => a.position.order - b.position.order),
  );
}

/**
 * Tile types that only make sense on paper: the day list (the website has
 * /termine, always current, and it would bloat a mail) and the crossword,
 * which can't be solved on a screen.
 */
const PRINT_ONLY_TILE_TYPES: MonthlyTile["type"][] = ["EVENTS", "CROSSWORD"];

/**
 * Tiles to show on screen, in reading order. The letter shows in one piece,
 * at its first frame.
 */
export function screenTiles(tiles: MonthlyTile[]): MonthlyTile[] {
  const firstLetter = letterSlotIds(tiles)[0];
  return tilesInReadingOrder(tiles).filter(
    (tile) =>
      !PRINT_ONLY_TILE_TYPES.includes(tile.type) &&
      (tile.type !== "LETTER" || tile.id === firstLetter),
  );
}

export function flyerAnnouncementTiles(tiles: MonthlyTile[]): MonthlyArticle[] {
  return tilesInReadingOrder(tiles).filter(
    (tile): tile is MonthlyArticle => tile.type === "ARTICLE",
  );
}

export function afterMassAnnouncementTiles(
  tiles: MonthlyTile[],
): MonthlyArticle[] {
  return flyerAnnouncementTiles(tiles).filter(
    (tile) => tile.announceAfterMass === true,
  );
}
