import { Liturgy } from "@/domain/liturgy/liturgy-data";

export function compareLiturgy(a: Liturgy, b: Liturgy) {
  const order = ["H", "F", "G", "", "g"];
  return order.indexOf(a.rank) - order.indexOf(b.rank);
}

function isSunday(date: string): boolean {
  return new Date(date + "T02:00").getDay() === 0;
}

/** Sundays and Hochfeste (H) are emphasized. */
export function isSpecialLiturgyDay(
  liturgy: Liturgy | undefined,
  date: string,
): boolean {
  return isSunday(date) || liturgy?.rank === "H";
}

/** Only Hochfeste (H), Feste (F) and Sundays are displayed prominently. */
export function isDisplayedLiturgy(
  liturgy: Liturgy | undefined,
  date: string,
): boolean {
  if (!liturgy) return false;
  return liturgy.rank === "F" || isSpecialLiturgyDay(liturgy, date);
}

/**
 * Day-phase suffixes on liturgy names, e.g. "Pfingsten, Am Vorabend" or
 * "Weihnachten – Hochfest der Geburt des Herrn, In der Heiligen Nacht".
 * They distinguish multiple celebrations of the same feast and are correct
 * for naming a specific MASS — but wrong when labeling the whole day (as the
 * Wochen-/Monatsblatt event lists do).
 *
 * Complete set found in the imported eucharistiefeier.de data (2026/27):
 * ", Am Tag", ", Am Vorabend", ", Am Morgen", ", Am Heiligen Abend",
 * ", In der Heiligen Nacht" and Gründonnerstag's ", (am Abend)".
 */
const DAY_PHASE_SUFFIX =
  /,\s*\(?\s*(am tag|am vorabend|am morgen|am heiligen abend|in der heiligen nacht|am abend)\s*\)?\s*$/i;

/**
 * True for vigil/night/morning variants ("Am Vorabend", "In der Heiligen
 * Nacht", ...). When picking ONE liturgy to represent a whole day, these
 * should lose against the "Am Tag" (or unsuffixed) variant of equal rank —
 * e.g. Mariä Aufnahme has both H-ranked rows on Aug 15, but the day's gospel
 * is the "Am Tag" one.
 */
export function isVigilLiturgy(liturgy: Liturgy | undefined): boolean {
  if (!liturgy?.name) return false;
  return /,\s*\(?\s*(am vorabend|am heiligen abend|in der heiligen nacht|am morgen|am abend)\s*\)?\s*$/i.test(
    liturgy.name,
  );
}

/**
 * Pick THE liturgy representing a whole day: highest rank wins, and the
 * day mass beats vigil variants of equal rank (see isVigilLiturgy).
 */
export function pickDayLiturgy(
  liturgies: Liturgy[],
  date: string,
): Liturgy | undefined {
  return liturgies
    .filter((l) => l.date === date)
    .sort(
      (a, b) =>
        Number(isVigilLiturgy(a)) - Number(isVigilLiturgy(b)) ||
        compareLiturgy(a, b),
    )?.[0];
}

/** Liturgy name suitable for labeling a whole day (phase suffix stripped). */
export function liturgyDayName(liturgy: Liturgy | undefined): string {
  if (!liturgy?.name) return "";
  return (
    liturgy.name
      .replace(DAY_PHASE_SUFFIX, "")
      // The feed delivers HTML-escaped apostrophes ("Johannes&#039; des
      // Täufers"); we render names as plain text, so decode them.
      .replace(/&#0?39;/g, "'")
      .replace(/&amp;/g, "&")
      .trim()
  );
}
