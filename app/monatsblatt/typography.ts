/**
 * Typography scale for the Monatsblatt — the single place that defines font
 * sizes on the printed products. Exactly three roles; components reference
 * these instead of ad-hoc text-* classes.
 *
 * ONE base size, everything else relative: `body` is set once on the sheet
 * root, and every other size in the tiles is expressed in `em`. A layout can
 * therefore rescale its whole typography by changing only the root size —
 * which is what the A3 poster does (POSTER_TEXT_STEPS), where the wider
 * columns want larger type than the 100 mm flyer panels.
 *
 * Sizes at the flyer's 13 px base (Tailwind rem -> pt on the 96dpi canvas):
 *   title    1.85em ≈ 18 pt   — flyer title / cover text line
 *   heading  1.23em ≈ 12 pt   — article/tile headings
 *   body     13px   ≈ 9.75 pt — everything else (don't re-declare sizes)
 */
export const FLYER_TEXT = {
  title: "text-[1.85em] font-semibold tracking-tight",
  heading: "text-[1.23em] font-semibold leading-tight tracking-wide uppercase",
  body: "text-[13px]",
} as const;

/**
 * Base sizes offered for the A3 poster. More type means fewer events per
 * column, so this is the editor's main knob for making an issue fit the page
 * (the events flow simply re-distributes; see EventsFlow.tsx).
 */
export const POSTER_TEXT_STEPS: { label: string; px: number }[] = [
  { label: "Klein", px: 13 },
  { label: "Mittel", px: 15 },
  { label: "Groß", px: 17 },
];

export const POSTER_TEXT_PX_DEFAULT = 15;
