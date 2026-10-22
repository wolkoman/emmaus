/**
 * Shared display helpers for event lists (Wochenblatt + Monatsblatt), so
 * both print products render events identically.
 */

/** Editorial shortenings for over-long calendar summaries. */
export function prettifyEventSummary(summary: string): string {
  return summary
    .replaceAll(
      "Sakramentenvorbereitung Versöhnung und Kommunion",
      "Sakramenten​vorbereitung",
    )
    .replaceAll("Sakrament der Taufe für", "Taufe für")
    .replaceAll(
      "Hl. Messe der koreanischen Gemeinde",
      "Hl. Messe (koreanisch)",
    );
}
