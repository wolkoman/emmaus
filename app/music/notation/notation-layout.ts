import { LETTER_TO_INDEX, type ParsedNote } from "../music-format";

export type Clef = "bass" | "treble";

export const STAFF_LAYOUT = {
  lineGap: 16,
  topLineY: 50,
  leftPad: 70,
  quarterWidth: 72,
  height: 190,
};

export function getBottomLineY() {
  return STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 4;
}

export function getBottomLineIndex(clef: Clef) {
  if (clef === "treble") {
    return 4 * 7 + LETTER_TO_INDEX.E;
  }

  return 2 * 7 + LETTER_TO_INDEX.G;
}

export function getStaffWidth(totalQuarters: number) {
  return Math.max(
    760,
    STAFF_LAYOUT.leftPad * 2 + totalQuarters * STAFF_LAYOUT.quarterWidth + 80,
  );
}

export function getNoteX(startQuarter: number) {
  return STAFF_LAYOUT.leftPad + 60 + startQuarter * STAFF_LAYOUT.quarterWidth;
}

export function getDiatonicIndex(note: ParsedNote) {
  if (note.type !== "note" || note.letter === null || note.octave === null) {
    return null;
  }

  return note.octave * 7 + LETTER_TO_INDEX[note.letter];
}

export function getNoteY(note: ParsedNote, clef: Clef) {
  const diatonicIndex = getDiatonicIndex(note);
  if (diatonicIndex === null) {
    return STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2;
  }

  return (
    getBottomLineY() -
    (diatonicIndex - getBottomLineIndex(clef)) * (STAFF_LAYOUT.lineGap / 2)
  );
}

export function getLedgerLineYs(y: number) {
  const lines: number[] = [];
  const halfGap = STAFF_LAYOUT.lineGap / 2;
  const topLineY = STAFF_LAYOUT.topLineY;
  const bottomLineY = getBottomLineY();

  if (y < topLineY - halfGap) {
    for (
      let current = topLineY - STAFF_LAYOUT.lineGap;
      current >= y - 1;
      current -= STAFF_LAYOUT.lineGap
    ) {
      lines.push(current);
    }
  }

  if (y > bottomLineY + halfGap) {
    for (
      let current = bottomLineY + STAFF_LAYOUT.lineGap;
      current <= y + 1;
      current += STAFF_LAYOUT.lineGap
    ) {
      lines.push(current);
    }
  }

  return lines;
}
