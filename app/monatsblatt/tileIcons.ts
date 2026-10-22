import type { IconType } from "react-icons";
import * as Pi from "react-icons/pi";

/**
 * Icons for Monatsblatt tiles, from the site's Phosphor pack
 * (react-icons/pi), always in the Bold variant.
 *
 * ARTICLE tiles store a bare icon name (e.g. "Coffee") that resolves to
 * `Pi<Name>Bold`; the picker can search ALL ~1500 bold icons. Importing the
 * whole pack is fine here: the print route resolves server-side, and the
 * client cost only affects the (admin-only) editor.
 */

const asBold = (name: string): IconType | undefined =>
  (Pi as Record<string, IconType | undefined>)[`Pi${name}Bold`];

export const DEFAULT_ARTICLE_ICON = "Megaphone";

/** Resolve a stored icon name; tolerates legacy lowercase keys. */
export function articleIcon(name?: string): IconType {
  const normalized = name ? name[0].toUpperCase() + name.slice(1) : "";
  return asBold(normalized) ?? asBold(DEFAULT_ARTICLE_ICON)!;
}

/** All bold icon names ("Coffee", "HandsPraying", ...), sorted. */
export const ALL_ICON_NAMES: string[] = Object.keys(Pi)
  .filter((key) => key.startsWith("Pi") && key.endsWith("Bold"))
  .map((key) => key.slice(2, -4))
  .sort();

/** Curated favorites shown in the picker before searching. */
export const SUGGESTED_ICONS: string[] = [
  "Megaphone",
  "Church",
  "Cross",
  "HandsPraying",
  "HandHeart",
  "Heart",
  "UsersThree",
  "Coffee",
  "MusicNotes",
  "Gift",
  "Baby",
  "GraduationCap",
  "Flame",
  "Flower",
  "Sun",
  "Star",
  "Sparkle",
  "GlobeHemisphereWest",
  "Info",
  "CalendarHeart",
  "ForkKnife",
  "Confetti",
  "TreeEvergreen",
  "Bell",
];

/**
 * Fixed icons of the non-article tile types (bold variants). ISSUE_INFO is not
 * a tile type but mandatory content (see IssueInfoView) — it shares the pack so
 * the headings stay visually consistent.
 */
export const TILE_ICONS = {
  ISSUE_INFO: Pi.PiEnvelopeBold,
  EVENTS: Pi.PiCalendarDotsBold,
  EVANGELIEN: Pi.PiBookOpenTextBold,
  GEBETSANLIEGEN: Pi.PiHandsPrayingBold,
  INSTAGRAM: Pi.PiInstagramLogoBold,
  CROSSWORD: Pi.PiPuzzlePieceBold,
} as const;
