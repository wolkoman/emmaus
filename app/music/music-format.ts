import type { Clef } from "./notation/notation-layout";

export type DurationSymbol = "w" | "h" | "q" | "e" | "s";

export type ParsedNote = {
  id: string;
  staffId: string;
  type: "note" | "rest";
  pitch: string | null;
  accidental: "#" | "b" | null;
  octave: number | null;
  letter: string | null;
  duration: DurationSymbol;
  dotted: boolean;
  triplet: boolean;
  tieToNext: boolean;
  lyric: string | null;
  line: number;
};

export type ParsedStaff = {
  id: string;
  label: string;
  clef: Clef;
  notes: ParsedNote[];
};

export type ParseResult = {
  staves: ParsedStaff[];
  errors: ParseError[];
};

export type ParseError = {
  line: number | null;
  message: string;
  content: string | null;
};

export const DEFAULT_SOURCE = `staff soprano treble "Soprano"
C4 e.
F4 s -
F4 h
A4 3e
G4 3e
F4 3e
A4 h
G4 q
F4 h
D4 q
c4 h
c4 e.
f4 s -
f4 h
a4 3e
g4 3e
f4 3e
a4 h
g4 e.
c5 s -
c5 h. -
c5 h
a4 e.
c5 s -
c5 h
a4 3e
g4 3e
f4 3e
a4 h
g4 q
f4 h
d4 q
c4 h
c4 e.
f4 s
f4 h
a4 3e
g4 3e
f4 3e
a4 h
g4 q
f4 h. -
f4 h
a4 e.
c5 s
c5 h
a4 3e
g4 3e
f4 3e
a4 q
r q
g4 q
f4 h
d4 q
c4 h
c4 e.
f4 s
f4 h
a4 3e
g4 3e
f4 3e
a4 h
g4 q
f4 h.-
f4 h

staff bass bass "Bass"
F3 q "A"
f3 h "ma"
f3 q "zing"
f3 h "grace,"
a2 q "how"
bb2 h "sweet"
d3 q "that"
f3 h "sound!"
f3 q "That"
f3 h "saved"
e3 q "a"
d3 h "wretch"
db3 q "like"
c3 q "me"
d3 q ","
d#3 q "like"
e3 h "me!"
f3 q "I"
f3 h "once"
c3 q "was"
f2 q "lost"
g2 q ""
a2 q "but"
bb2 h "now"
b2 q "Im"
c3 h "found,"
c3 q "was"
c3 h "blind"
c3 q "but"
g2 h "now"
c3 q "I"
f3 h. "see"
c3 h
c3 q "I"
f2 h "once"
f2 q "was"
f2 q "lost"
r q
a2 q "but"
bb2 h "now"
d3 q "Im"
f3 h "found,"
e3 q "was"
d3 h "blind"
c3 q "but"
bb2 h "now"
c3 q "I"
f3 h "see"
c3 q "I"
f2 h "see"
`;

const BASE_DURATION_TO_QUARTERS: Record<DurationSymbol, number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
};

export function getDurationInQuarters(
  note: Pick<ParsedNote, "duration" | "dotted" | "triplet">,
) {
  const baseDuration = BASE_DURATION_TO_QUARTERS[note.duration];
  const dottedDuration = note.dotted ? baseDuration * 1.5 : baseDuration;
  return note.triplet ? dottedDuration * (2 / 3) : dottedDuration;
}

export function formatDuration(
  duration: DurationSymbol,
  dotted: boolean,
  triplet = false,
) {
  return `${triplet ? "3" : ""}${duration}${dotted ? "." : ""}`;
}

export const LETTER_TO_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

function inferClefFromStaffId(staffId: string): Clef {
  const lowerId = staffId.toLowerCase();

  if (lowerId.includes("bass")) {
    return "bass";
  }

  return "treble";
}

function formatStaffLabel(staffId: string) {
  if (!staffId.length) {
    return "Staff";
  }

  return `${staffId[0].toUpperCase()}${staffId.slice(1)}`;
}

export function getTotalDurationInQuarters(notes: ParsedNote[]) {
  return notes.reduce((sum, note) => sum + getDurationInQuarters(note), 0);
}

export function parseMusic(source: string): ParseResult {
  const lines = source.split(/\r?\n/);
  const staves: ParsedStaff[] = [];
  const errors: ParseError[] = [];
  let currentStaff: ParsedStaff | null = null;
  let implicitStaffCounter = 0;

  function pushError(
    line: number | null,
    message: string,
    content: string | null = null,
  ) {
    errors.push({ line, message, content });
  }

  function ensureCurrentStaff() {
    if (currentStaff) {
      return currentStaff;
    }

    implicitStaffCounter += 1;
    currentStaff = {
      id:
        implicitStaffCounter === 1
          ? "melody"
          : `melody-${implicitStaffCounter}`,
      label:
        implicitStaffCounter === 1
          ? "Melody"
          : `Melody ${implicitStaffCounter}`,
      clef: "bass",
      notes: [],
    };
    staves.push(currentStaff);
    return currentStaff;
  }

  for (const [index, rawLine] of lines.entries()) {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith("//")) {
      continue;
    }

    const staffMatch = line.match(
      /^staff\s+([A-Za-z0-9_-]+)(?:\s+(bass|treble))?(?:\s+"([^"]+)")?$/i,
    );

    if (staffMatch) {
      const staffId = staffMatch[1];
      const explicitClef = staffMatch[2]?.toLowerCase() as Clef | undefined;
      const label = staffMatch[3] || formatStaffLabel(staffId);

      currentStaff = {
        id: staffId,
        label,
        clef: explicitClef ?? inferClefFromStaffId(staffId),
        notes: [],
      };
      staves.push(currentStaff);
      continue;
    }

    if (line.includes("=")) {
      pushError(
        lineNumber,
        "Settings are not supported here. Use staff blocks and note lines only.",
        rawLine,
      );
      continue;
    }

    const noteMatch = line.match(
      /^([A-GR])([#b]?)(\d+)?\s+(3)?(w|h|q|e|s)(\.)?\s*(-)?(?:\s+"([^"]*)")?$/i,
    );

    if (!noteMatch) {
      pushError(
        lineNumber,
        'Use note lines like `G2 q "Ly-"`, `F#2 h. -`, `Bb2 3e` or `R s`.',
        rawLine,
      );
      continue;
    }

    const staff = ensureCurrentStaff();
    const symbol = noteMatch[1].toUpperCase();
    const accidental = (noteMatch[2] || null) as "#" | "b" | null;
    const octave = noteMatch[3] ? Number(noteMatch[3]) : null;
    const triplet = noteMatch[4] === "3";
    const duration = noteMatch[5].toLowerCase() as DurationSymbol;
    const dotted = noteMatch[6] === ".";
    const tieToNext = noteMatch[7] === "-";
    const lyric = noteMatch[8] ?? null;

    if (triplet && duration !== "e" && duration !== "s") {
      pushError(
        lineNumber,
        "Only `3e` and `3s` triplets are supported right now.",
        rawLine,
      );
    }

    if (triplet && dotted) {
      pushError(
        lineNumber,
        "Dotted triplets are not supported right now.",
        rawLine,
      );
    }

    if (symbol === "R") {
      if (tieToNext) {
        pushError(lineNumber, "Rests cannot tie to the next note.", rawLine);
      }

      staff.notes.push({
        id: `${staff.id}:${staff.notes.length}`,
        staffId: staff.id,
        type: "rest",
        pitch: null,
        accidental: null,
        octave: null,
        letter: null,
        duration,
        dotted,
        triplet,
        tieToNext: false,
        lyric,
        line: lineNumber,
      });
      continue;
    }

    if (octave === null) {
      pushError(lineNumber, "Notes need an octave like G2 or C3.", rawLine);
      continue;
    }

    staff.notes.push({
      id: `${staff.id}:${staff.notes.length}`,
      staffId: staff.id,
      type: "note",
      pitch: `${symbol}${accidental ?? ""}${octave}`,
      accidental,
      octave,
      letter: symbol,
      duration,
      dotted,
      triplet,
      tieToNext,
      lyric,
      line: lineNumber,
    });
  }

  staves.forEach((staff) => {
    staff.notes.forEach((note, index) => {
      if (!note.tieToNext) {
        return;
      }

      const nextNote = staff.notes[index + 1];
      if (
        !nextNote ||
        nextNote.type !== "note" ||
        note.type !== "note" ||
        nextNote.pitch !== note.pitch
      ) {
        pushError(
          note.line,
          "`-` must tie to the next note with the same pitch.",
          lines[note.line - 1] ?? null,
        );
      }
    });
  });

  if (!staves.some((staff) => staff.notes.length > 0)) {
    pushError(null, "Enter at least one note or rest.");
  }

  return { staves, errors };
}
