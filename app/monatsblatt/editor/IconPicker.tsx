"use client";

import {
  ALL_ICON_NAMES,
  articleIcon,
  SUGGESTED_ICONS,
} from "@/app/monatsblatt/tileIcons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/util/utils";
import { useMemo, useState } from "react";

const MAX_RESULTS = 60;

/** German search terms mapped onto the (English) Phosphor icon names. */
const GERMAN_ALIASES: Record<string, string> = {
  kirche: "church",
  kreuz: "cross",
  herz: "heart",
  beten: "pray",
  gebet: "pray",
  kaffee: "coffee",
  musik: "music",
  geschenk: "gift",
  taufe: "baby",
  kind: "baby",
  sonne: "sun",
  stern: "star",
  glocke: "bell",
  wein: "wine",
  brot: "bread",
  feuer: "fire",
  flamme: "flame",
  kalender: "calendar",
  buch: "book",
  blume: "flower",
  baum: "tree",
  engel: "angel",
  krone: "crown",
  taube: "bird",
  fisch: "fish",
  hand: "hand",
  familie: "users",
  gemeinschaft: "users",
  gruppe: "users",
  essen: "fork",
  welt: "globe",
  wasser: "drop",
  licht: "lightbulb",
  kerze: "candle",
  friede: "peace",
  frieden: "peace",
};

/** camelCase-aware match: "hand pray" finds "HandsPraying". */
function matches(name: string, query: string): boolean {
  const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => GERMAN_ALIASES[part] ?? part)
    .every((part) => words.includes(part));
}

/**
 * Icon picker for ARTICLE tiles: searches the entire Phosphor bold set
 * (~1500 icons); shows a curated selection until you type. Only the first
 * 60 matches render, which keeps the grid instant.
 */
export function IconPicker(props: {
  value?: string;
  onChange: (icon: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const Current = articleIcon(props.value);

  const shown = useMemo(() => {
    if (!query.trim()) return SUGGESTED_ICONS;
    return ALL_ICON_NAMES.filter((name) => matches(name, query)).slice(
      0,
      MAX_RESULTS,
    );
  }, [query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        {/* Negative margin compensates the hover padding, so the icon sits
            exactly where ArticleView renders it — no layout shift on focus. */}
        <button
          type="button"
          title="Symbol wählen"
          className="-m-1 shrink-0 rounded-md p-1 hover:bg-black/5"
        >
          <Current aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <input
          autoFocus
          placeholder={`${ALL_ICON_NAMES.length} Symbole durchsuchen…`}
          className="mb-2 w-full rounded-md border px-2 py-1 text-sm outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid max-h-56 grid-cols-7 gap-0.5 overflow-y-auto">
          {shown.map((name) => {
            const Icon = articleIcon(name);
            return (
              <button
                key={name}
                type="button"
                title={name}
                className={cn(
                  "flex items-center justify-center rounded-md p-1.5 text-lg hover:bg-black/5",
                  name === props.value && "bg-emmaus/10 outline-emmaus outline",
                )}
                onClick={() => {
                  props.onChange(name);
                  setOpen(false);
                }}
              >
                <Icon aria-hidden />
              </button>
            );
          })}
          {shown.length === 0 && (
            <div className="text-muted-foreground col-span-7 py-4 text-center text-sm">
              Keine Treffer
            </div>
          )}
        </div>
        {!!query.trim() &&
          ALL_ICON_NAMES.filter((n) => matches(n, query)).length >
            MAX_RESULTS && (
            <div className="text-muted-foreground pt-1 text-center text-xs">
              Weitere Treffer — Suche verfeinern
            </div>
          )}
      </PopoverContent>
    </Popover>
  );
}
