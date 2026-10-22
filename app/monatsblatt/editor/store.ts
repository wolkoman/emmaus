"use client";
import {
  fetchMonthlyDataByName,
  fetchMonthlyVersions,
  loadPapalIntention,
  upsertMonthly,
} from "@/app/monatsblatt/editor/actions";
import { PanelId } from "@/app/monatsblatt/fold";
import {
  moveTile,
  nextTileOrder,
  normalizeTilePositions,
} from "@/app/monatsblatt/editor/tile-order";
import {
  POSTER_PANELS,
  posterColumnTiles,
  posterPlacement,
  type PosterPanelId,
  type PosterPlacement,
} from "@/app/monatsblatt/poster";
import { DEFAULT_ARTICLE_ICON } from "@/app/monatsblatt/tileIcons";
import { LETTER_TITLE } from "@/app/monatsblatt/letter";
import { POSTER_TEXT_PX_DEFAULT } from "@/app/monatsblatt/typography";
import { loadRangeEvents } from "@/app/monatsblatt/editor/loadRangeEvents";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { v4 as uuidv4 } from "uuid";
import { create, StoreApi, UseBoundStore } from "zustand";
import { combine, persist } from "zustand/middleware";

/**
 * Editor store for the Monatsmitteilungen flyer: tiles live on one of six
 * flyer panels (see app/monatsblatt/fold.ts).
 *
 * The persisted blob (everything non-function) is what gets saved to the
 * `monthlies` PB collection and read back by the print route.
 */

export type MonthlyTile =
  | MonthlyArticle
  | MonthlyEvents
  | MonthlyEvangelien
  | MonthlyPapalIntention
  | MonthlyInstagram
  | MonthlyCrossword
  | MonthlyImage
  | MonthlyLetterFrame;

interface GeneralItem {
  id: string;
  position: PanelPosition;
  /**
   * Placement in the A3 poster layout (app/monatsblatt/poster.ts) — the same
   * tile, a second position. Undefined until the poster editor first moves or
   * hides the tile; `posterPlacement()` supplies the default until then.
   */
  poster?: PosterPlacement;
}

export type MonthlyArticle = {
  type: "ARTICLE";
  title: string;
  text: string;
  announceAfterMass?: boolean;
  /** Key into ARTICLE_ICONS (app/monatsblatt/tileIcons.ts). */
  icon?: string;
} & GeneralItem;
export type MonthlyEvents = {
  type: "EVENTS";
} & GeneralItem;
/** "Evangelien des Monats": gospel verse refs of higher celebrations. */
export type MonthlyEvangelien = {
  type: "EVANGELIEN";
} & GeneralItem;
/** "Gebetsanliegen des Papstes": monthly papal prayer intention. */
export type MonthlyPapalIntention = {
  type: "GEBETSANLIEGEN";
} & GeneralItem;
/** "Folgen Sie uns auf Instagram": static social media card. */
export type MonthlyInstagram = {
  type: "INSTAGRAM";
} & GeneralItem;
/** Kreuzworträtsel: layout is derived from the words at render time. */
export type MonthlyCrossword = {
  type: "CROSSWORD";
  words: CrosswordWord[];
} & GeneralItem;
export type CrosswordWord = { answer: string; clue: string };
/**
 * Full-width image without a heading. `url` points at a PB-served file
 * (see uploadMonthlyImage); empty until the first upload. The image fills
 * the panel width, `heightMm` caps how tall it may get (see ImageView).
 */
export type MonthlyImage = {
  type: "IMAGE";
  url: string;
  heightMm: number;
} & GeneralItem;

export const DEFAULT_IMAGE_HEIGHT_MM = 50;

/**
 * Frame of the "Wort des Pfarrers": the text lives once in
 * `MonthlyData.letter` and flows through all LETTER frames (LetterFlow.tsx).
 */
export type MonthlyLetterFrame = {
  type: "LETTER";
} & GeneralItem;
export type MonthlyLetter = {
  text: string;
};

/** Starter words so a fresh crossword tile renders something sensible. */
export const DEFAULT_CROSSWORD_WORDS: CrosswordWord[] = [
  { answer: "EMMAUS", clue: "Unsere Pfarre" },
  { answer: "KIRCHE", clue: "Haus des Gebets" },
  { answer: "SEGEN", clue: "Zuspruch am Ende der Messe" },
  { answer: "AMEN", clue: "So sei es" },
  { answer: "TAUFE", clue: "Erstes Sakrament" },
  { answer: "ORGEL", clue: "Königin der Instrumente" },
];

export type PanelPosition = {
  panel: PanelId;
  order: number;
};

/** The serializable slice of the store (persisted + printed). */
export interface MonthlyData {
  month: string; // "YYYY-MM" — nominal issue month (title, sorting)
  name: string; // "August 2026"
  /**
   * Actual covered date span. Defaults to the month's boundaries, but is
   * freely adjustable — e.g. the December issue runs until Jan 6 to cover
   * the Christmas break.
   */
  dateRange: { start: string; end: string };
  events: (CalendarEvent & { customEventDescription?: string })[];
  /**
   * When the events were last pulled from the calendar (ISO). Printed as the
   * issue's "Stand" — readers need to know how current the list is.
   */
  eventsFetchedAt?: string;
  /** Papal prayer intention for the issue month (loaded with the events). */
  papalIntention: { title: string; text: string } | null;
  /** Editorial cover line, e.g. "Willkommen in der Sommerpause". */
  coverText: string;
  /**
   * Base font size of the A3 poster in px (app/monatsblatt/typography.ts).
   * Undefined in issues saved before the poster existed.
   */
  posterTextPx?: number;
  /**
   * Whether the issue has an Einlage (panels 6 and 7, see fold.ts). Undefined
   * in issues saved before the Einlage existed.
   */
  hasInsert?: boolean;
  /** "Wort des Pfarrers"; undefined until the first LETTER frame. */
  letter?: MonthlyLetter;
  tiles: MonthlyTile[];
}

export type MonthlyEditorStore =
  typeof useMonthlyEditorStore extends UseBoundStore<StoreApi<infer T>>
    ? T
    : never;

/** The printable slice of the live store (drops actions and UI state). */
export function monthlyDataOf(state: MonthlyData): MonthlyData {
  return {
    month: state.month,
    name: state.name,
    dateRange: state.dateRange,
    events: state.events,
    eventsFetchedAt: state.eventsFetchedAt,
    papalIntention: state.papalIntention,
    coverText: state.coverText,
    posterTextPx: state.posterTextPx,
    hasInsert: state.hasInsert,
    letter: state.letter,
    tiles: state.tiles,
  };
}

/** A saved blob as the editor holds it: defaults for fields added later. */
function loadedData(data: MonthlyData): MonthlyData {
  const migrated = migrateLetterArticle(data);
  return {
    ...migrated,
    coverText: data.coverText ?? "",
    eventsFetchedAt: data.eventsFetchedAt ?? "",
    posterTextPx: data.posterTextPx ?? POSTER_TEXT_PX_DEFAULT,
    hasInsert: data.hasInsert ?? false,
    tiles: normalizeTilePositions(migrated.tiles ?? []),
  };
}

/**
 * Issues before the LETTER type carried the letter as an ARTICLE titled
 * "Wort des Pfarrers"; turn that into the letter plus one frame in its place.
 */
function migrateLetterArticle<T extends Pick<MonthlyData, "tiles" | "letter">>(
  data: T,
): T {
  const tiles = data.tiles ?? [];
  if (data.letter || tiles.some((tile) => tile.type === "LETTER")) return data;
  const article = tiles.find(
    (tile): tile is MonthlyArticle =>
      tile.type === "ARTICLE" &&
      tile.title.trim().toLowerCase() === LETTER_TITLE.toLowerCase(),
  );
  if (!article) return data;
  return {
    ...data,
    letter: { text: article.text },
    tiles: tiles.map((tile) =>
      tile.id === article.id
        ? {
            type: "LETTER",
            id: tile.id,
            position: tile.position,
            poster: tile.poster,
          }
        : tile,
    ),
  };
}

/** JSON with sorted keys, so saved and live data compare by content. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1)),
        )
      : v,
  );
}

function monthName(month: string): string {
  const date = new Date(month + "-01T02:00");
  return date.toLocaleDateString("de-AT", { month: "long", year: "numeric" });
}

function monthRange(month: string): { start: string; end: string } {
  const start = `${month}-01`;
  const lastDay = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate();
  return { start, end: `${month}-${String(lastDay).padStart(2, "0")}` };
}

export const useMonthlyEditorStore = create(
  persist(
    combine(
      {
        month: "",
        name: "",
        dateRange: { start: "", end: "" },
        events: [] as MonthlyData["events"],
        eventsFetchedAt: "",
        papalIntention: null as MonthlyData["papalIntention"],
        coverText: "",
        posterTextPx: POSTER_TEXT_PX_DEFAULT,
        hasInsert: false,
        letter: undefined as MonthlyLetter | undefined,
        tiles: [
          {
            type: "EVENTS",
            id: "default-events",
            position: { panel: 1, order: 0 },
          },
        ] as MonthlyTile[],
        loading: false,
      },
      (set, get) => ({
        setMonth: (month: string) => {
          if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
            throw new Error(`Ungültiger Monat „${month}“ (erwartet JJJJ-MM)`);
          }
          // Picking a month resets the date range to the month's boundaries;
          // setDateRange can widen/narrow it afterwards.
          set({ month, name: monthName(month), dateRange: monthRange(month) });
        },
        setDateRange: (dateRange: { start: string; end: string }) => {
          set({ dateRange });
        },
        setCoverText: (coverText: string) => {
          set({ coverText });
        },
        /** Base font size of the poster; the whole poster scale follows it. */
        setPosterTextPx: (posterTextPx: number) => {
          set({ posterTextPx });
        },
        /** The editor only offers switching off while the Einlage is empty. */
        setHasInsert: (hasInsert: boolean) => {
          set({ hasInsert });
        },
        loadRange: async () => {
          const { start, end } = get().dateRange;
          if (get().loading || !start || !end) return;
          set({ loading: true });
          await Promise.all([
            loadRangeEvents(start, end)
              .then((events) =>
                set({ events, eventsFetchedAt: new Date().toISOString() }),
              )
              .catch((error) => console.log({ error })),
            loadPapalIntention(get().month)
              .then((papalIntention) =>
                set({ papalIntention: papalIntention ?? null }),
              )
              .catch((error) => console.log({ error })),
          ]).finally(() => set({ loading: false }));
        },
        /**
         * Fills a missing papal intention without reloading the events (that
         * would drop custom event descriptions). Covers issues whose intention
         * was looked up under a broken month, or entered in PB later.
         */
        ensurePapalIntention: async () => {
          const { month, papalIntention } = get();
          if (papalIntention || !/^\d{4}-\d{2}$/.test(month)) return;
          const loaded = await loadPapalIntention(month).catch(() => undefined);
          if (loaded && get().month === month && !get().papalIntention) {
            set({ papalIntention: loaded });
          }
        },
        save: async () => {
          set({ loading: true });
          const data = Object.fromEntries(
            Object.entries(get()).filter(
              ([, value]) => typeof value != "function",
            ),
          );
          await upsertMonthly(get().name, get().month, data).finally(() =>
            set({ loading: false }),
          );
        },
        loadVersion: async (name: string) => {
          const data = await fetchMonthlyDataByName(name);
          if (!data) throw new Error(`Monthly "${name}" not found`);
          set({ ...loadedData(data as MonthlyData), loading: false });
        },
        /** Whether the local draft differs from the saved state of its issue. */
        hasUnsavedChanges: async () => {
          const { name } = get();
          if (!name) return false;
          const saved = await fetchMonthlyDataByName(name).catch(() => null);
          if (!saved) return true;
          return (
            canonicalJson(monthlyDataOf(loadedData(saved as MonthlyData))) !==
            canonicalJson(monthlyDataOf(get()))
          );
        },
        getAll: async () => {
          return await fetchMonthlyVersions();
        },
        normalizeTilePositions: () => {
          const migrated = migrateLetterArticle(get());
          const tiles = normalizeTilePositions(migrated.tiles);
          // Skip no-op writes so opening the editor leaves no undo step.
          if (JSON.stringify(tiles) !== JSON.stringify(get().tiles)) {
            set({ tiles, letter: migrated.letter });
          }
        },
        setLetter: (patch: Partial<MonthlyLetter>) => {
          set((state) => ({
            letter: {
              ...(state.letter ?? { text: "" }),
              ...patch,
            },
          }));
        },
        /** First frame of the letter, or a continuation frame for it. */
        insertLetterSlot: (panel: PanelId) => {
          const id = uuidv4();
          set({
            letter: get().letter ?? { text: "" },
            tiles: [
              ...get().tiles,
              {
                type: "LETTER",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
              },
            ],
          });
          return id;
        },
        insertArticle: (panel: PanelId) => {
          const id = uuidv4();
          set({
            tiles: [
              ...get().tiles,
              {
                type: "ARTICLE",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
                title: "Überschrift",
                text: "",
                announceAfterMass: false,
                icon: DEFAULT_ARTICLE_ICON,
              },
            ],
          });
          return id;
        },
        /**
         * Prefilled ARTICLE tile explaining Messintentionen (editable like
         * any article). Stipend amount per Gebührenordnung der Erzdiözese
         * Wien (WDBl 158 [2020]): 9 Euro.
         */
        insertMessintentionen: (panel: PanelId) => {
          const id = uuidv4();
          set({
            tiles: [
              ...get().tiles,
              {
                type: "ARTICLE",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
                title: "Messintentionen",
                text:
                  "<p>Bei einer Messintention wird eine heilige Messe in einem persönlichen Anliegen gefeiert – etwa für Verstorbene, zum Geburtstag, aus Dankbarkeit oder in einer besonderen Bitte.</p>" +
                  "<p>Der Beitrag (Messstipendium) beträgt in der Erzdiözese Wien 9 Euro. Wenn Sie eine Messe in Ihrem Anliegen feiern lassen möchten, melden Sie sich vor oder nach einem Gottesdienst in der Sakristei.</p>",
                announceAfterMass: false,
                icon: "Cross",
              },
            ],
          });
          return id;
        },
        /** Adds a linked continuation frame for the events flow. */
        insertEventsSlot: (panel: PanelId) => {
          const id = uuidv4();
          set({
            tiles: [
              ...get().tiles,
              {
                type: "EVENTS",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
              },
            ],
          });
          return id;
        },
        insertEvangelien: (panel: PanelId) => {
          const id = uuidv4();
          set({
            tiles: [
              ...get().tiles,
              {
                type: "EVANGELIEN",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
              },
            ],
          });
          return id;
        },
        insertPapalIntention: (panel: PanelId) => {
          const id = uuidv4();
          set({
            tiles: [
              ...get().tiles,
              {
                type: "GEBETSANLIEGEN",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
              },
            ],
          });
          return id;
        },
        insertInstagram: (panel: PanelId) => {
          const id = uuidv4();
          set({
            tiles: [
              ...get().tiles,
              {
                type: "INSTAGRAM",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
              },
            ],
          });
          return id;
        },
        insertImage: (panel: PanelId) => {
          const id = uuidv4();
          set({
            tiles: [
              ...get().tiles,
              {
                type: "IMAGE",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
                url: "",
                heightMm: DEFAULT_IMAGE_HEIGHT_MM,
              },
            ],
          });
          return id;
        },
        insertCrossword: (panel: PanelId) => {
          const id = uuidv4();
          set({
            tiles: [
              ...get().tiles,
              {
                type: "CROSSWORD",
                position: { panel, order: nextTileOrder(get().tiles, panel) },
                id,
                words: DEFAULT_CROSSWORD_WORDS,
              },
            ],
          });
          return id;
        },
        updateTile: (
          tileId: string,
          update: (tile: MonthlyTile) => MonthlyTile,
        ) => {
          set((state) => ({
            tiles: state.tiles.map((tile) =>
              tile.id === tileId ? update(tile) : tile,
            ),
          }));
        },
        removeTile: (id: string) => {
          set((state) => ({
            tiles: normalizeTilePositions(
              state.tiles.filter((item) => item.id !== id),
            ),
          }));
        },
        /** Poster layout: show/hide a tile without touching the flyer. */
        setPosterVisible: (tileId: string, isVisible: boolean) => {
          set((state) => ({
            tiles: state.tiles.map((tile) =>
              tile.id === tileId
                ? { ...tile, poster: { ...posterPlacement(tile), isVisible } }
                : tile,
            ),
          }));
        },
        /**
         * Poster layout counterpart of `reorder`: moves a tile to `order`
         * within a poster column and renumbers both columns to 0..n-1, which
         * also materializes the derived defaults of untouched tiles.
         */
        reorderPoster: (
          tileId: string,
          panel: PosterPanelId,
          order: number,
        ) => {
          set((state) => {
            const moved = state.tiles.find((tile) => tile.id === tileId);
            if (!moved) return state;

            const columns = new Map<PosterPanelId, MonthlyTile[]>();
            for (const { id } of POSTER_PANELS) {
              columns.set(
                id,
                posterColumnTiles(state.tiles, id).filter(
                  (tile) => tile.id !== tileId,
                ),
              );
            }
            const target = columns.get(panel)!;
            target.splice(Math.min(order, target.length), 0, moved);

            const placements = new Map<string, PosterPlacement>();
            for (const [column, tiles] of columns) {
              tiles.forEach((tile, index) =>
                placements.set(tile.id, {
                  ...posterPlacement(tile),
                  panel: column,
                  order: index,
                }),
              );
            }
            return {
              tiles: state.tiles.map((tile) => {
                const poster = placements.get(tile.id);
                return poster ? { ...tile, poster } : tile;
              }),
            };
          });
        },
        setCustomDescription: (eventId: string, description?: string) => {
          set((state) => ({
            events: state.events.map((event) =>
              event.id === eventId
                ? { ...event, customEventDescription: description }
                : event,
            ),
          }));
        },
        reorder: (tileId: string, panel: PanelId, order: number) => {
          set((state) => ({
            tiles: moveTile(state.tiles, tileId, panel, order),
          }));
        },
      }),
    ),
    { name: "monthly-editor-storage-v2" },
  ),
);

const HISTORY_LIMIT = 100;
/** Changes closer together than this (typing, slider drags) undo as one step. */
const HISTORY_COALESCE_MS = 1000;

/**
 * In-memory undo history of the issue data. Recorded by subscribing to the
 * store, so every action (delete, AI rewrite, version load, typing) is
 * covered without each one having to opt in.
 */
export const useMonthlyEditorHistory = create(
  combine({ past: [] as MonthlyData[] }, (set, get) => ({
    undo: () => {
      const past = get().past;
      const previous = past.at(-1);
      if (!previous) return;
      restoring = true;
      useMonthlyEditorStore.setState(previous);
      restoring = false;
      set({ past: past.slice(0, -1) });
    },
  })),
);

let restoring = false;
let lastRecordedAt = 0;

useMonthlyEditorStore.subscribe((state, prev) => {
  if (restoring) return;
  const before = monthlyDataOf(prev);
  const after = monthlyDataOf(state);
  const changed = (Object.keys(before) as (keyof MonthlyData)[]).some(
    (key) => before[key] !== after[key],
  );
  if (!changed) return;
  const now = Date.now();
  // Adding/removing a tile or switching issues is always its own step.
  const structural =
    before.tiles.length !== after.tiles.length || before.name !== after.name;
  if (structural || now - lastRecordedAt > HISTORY_COALESCE_MS) {
    useMonthlyEditorHistory.setState(({ past }) => ({
      past: [...past, before].slice(-HISTORY_LIMIT),
    }));
  }
  lastRecordedAt = now;
});
