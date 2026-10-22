/**
 * Types for crossword-layout-generator (plain JS, no bundled types).
 * Deterministic greedy placement — no randomness, so editor preview and
 * print route always produce the same layout for the same word list.
 */
declare module "crossword-layout-generator" {
  export interface CrosswordInputWord {
    clue: string;
    answer: string;
  }

  export interface CrosswordPlacedWord extends CrosswordInputWord {
    /** 1-based column of the first letter (absent when unplaced). */
    startx?: number;
    /** 1-based row of the first letter (absent when unplaced). */
    starty?: number;
    /** Clue number; words starting on the same cell share one. */
    position?: number;
    /** "none" = the generator could not place this word. */
    orientation: "across" | "down" | "none";
  }

  export function generateLayout(words: CrosswordInputWord[]): {
    rows: number;
    cols: number;
    /** rows × cols letter grid; "-" marks an empty cell. */
    table: string[][];
    table_string: string;
    result: CrosswordPlacedWord[];
  };
}
