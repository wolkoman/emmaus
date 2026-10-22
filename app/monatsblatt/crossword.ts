import { generateLayout } from "crossword-layout-generator";

export interface CrosswordEntry {
  answer: string;
  clue: string;
}

export interface CrosswordAnnouncement {
  title: string;
  html: string;
}

const EMPTY_LAYOUT = {
  rows: 0,
  cols: 0,
  table: [] as string[][],
  table_string: "",
  result: [],
};

export function normalizeCrosswordAnswer(value: string): string {
  return value
    .toLocaleUpperCase("de-AT")
    .replaceAll("Ä", "\uE000")
    .replaceAll("Ö", "\uE001")
    .replaceAll("Ü", "\uE002")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replaceAll("\uE000", "Ä")
    .replaceAll("\uE001", "Ö")
    .replaceAll("\uE002", "Ü")
    .replace(/[^A-ZÄÖÜ]/g, "");
}

export function createCrosswordLayout(words: CrosswordEntry[]) {
  const complete = words
    .map((word) => ({
      answer: normalizeCrosswordAnswer(word.answer),
      clue: word.clue.trim(),
    }))
    .filter((word) => word.answer && word.clue);

  return complete.length ? generateLayout(complete) : EMPTY_LAYOUT;
}
