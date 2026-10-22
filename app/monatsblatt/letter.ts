import type { MonthlyTile } from "@/app/monatsblatt/editor/store";
import sanitize from "sanitize-html";

/**
 * Server-safe helpers of the "Wort des Pfarrers" (the flow itself is the
 * client module LetterFlow.tsx).
 */

export const LETTER_TITLE = "Wort des Pfarrers";
/** Fixed like the portrait in LetterFlow.tsx. */
export const LETTER_AUTHOR = "Pfarrer Dr. Zvonko Brezovski";

export function sanitizeLetterHtml(html: string): string {
  return sanitize(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u"],
    allowedAttributes: {},
  });
}

/** LETTER frame IDs in reading order, see eventsSlotIds. */
export function letterSlotIds(tiles: MonthlyTile[]): string[] {
  return tiles
    .filter((t) => t.type === "LETTER")
    .sort(
      (a, b) =>
        a.position.panel - b.position.panel ||
        a.position.order - b.position.order,
    )
    .map((t) => t.id);
}

/**
 * German typography the AI check is told about but doesn't reliably apply:
 * „…“ quotes, …, spaced abbreviations, spaced dashes, single spaces. Runs on
 * the text between tags of sanitized letter HTML.
 */
export function normalizeTypography(html: string): string {
  let previous = " ";
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith("<")) {
        // Paragraph and line breaks start a new quote context.
        if (/^<\/?(p|br)\b/i.test(part)) previous = " ";
        return part;
      }
      const text = part
        .replace(/\.\.\./g, "…")
        .replace(/\b([zudo])\.\s*([Bahä])\./g, "$1. $2.")
        .replace(/ +- +/g, " – ")
        .replace(/ {2,}/g, " ")
        .replace(/[“”"]/g, (_, offset: number, whole: string) => {
          const before = offset === 0 ? previous : whole[offset - 1];
          return /[\s(\[„]/.test(before) ? "„" : "“";
        });
      if (text) previous = text.at(-1)!;
      return text;
    })
    .join("");
}
