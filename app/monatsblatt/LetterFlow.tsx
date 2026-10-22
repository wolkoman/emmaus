"use client";

import type { MonthlyData } from "@/app/monatsblatt/editor/store";
import { FLYER_TEXT } from "@/app/monatsblatt/typography";
import { cn } from "@/util/utils";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  LETTER_AUTHOR,
  LETTER_TITLE,
  sanitizeLetterHtml,
} from "@/app/monatsblatt/letter";

/**
 * "Wort des Pfarrers": one letter text (`MonthlyData.letter`) set into a chain
 * of LETTER frames, like the events flow (EventsFlow.tsx) — but split line by
 * line, so a paragraph continues mid-sentence in the next frame.
 *
 * How it works: frames are filled in reading order. For each frame, the
 * remaining text is rendered into an invisible measurer at the frame's width;
 * if it is taller than the frame's free height, the text is cut at the start
 * of the first line that doesn't fit (Range.cloneContents splits the HTML,
 * cloning the paragraph/emphasis the cut runs through). Frames widths differ
 * (97/100/95 mm panels), which is why the text is really split instead of
 * being clipped and offset.
 *
 * The letter is measured BEFORE the events flow: while it measures, the
 * events slots don't stretch (`useLetterFlowSettled`), so a letter frame
 * sharing a panel with an events slot sees the panel's whole free space.
 *
 * Print contract: `data-print-waiting` until the split is computed, like the
 * events flow (docs/pdf-render-jobs.md).
 */

/**
 * Shared by the measurer and the rendered parts, so both wrap identically.
 * Spacing only between paragraphs (p + p): a paragraph continued from the
 * previous frame starts flush at the top.
 */
const BODY_CLASS = "border-emmaus border-l-2 pl-[3mm] [&_p+p]:mt-[0.6em]";

interface FlowContext {
  slotIds: string[];
  parts: Record<string, string> | null;
  overflow: boolean;
  registerBody: (id: string, el: HTMLDivElement | null) => void;
}

const Ctx = createContext<FlowContext | null>(null);

/** Face crop of /personal/zvonko.png (from the high-res original in PB). */
const LETTER_PORTRAIT = "/personal/zvonko-portrait.jpg";

/** False while a letter flow above is still measuring (see EventsFlow). */
export function useLetterFlowSettled(): boolean {
  const flow = useContext(Ctx);
  return flow ? flow.parts !== null : true;
}

export function useLetterFlowMeasuring(): boolean {
  return !useLetterFlowSettled();
}

/**
 * Cut the measured content at the start of the first line whose bottom lies
 * below `availablePx`. Returns null when everything fits; an empty `before`
 * when not even the first line does.
 */
function splitAtHeight(
  measurer: HTMLElement,
  availablePx: number,
): { before: string; after: string } | null {
  if (measurer.offsetHeight <= availablePx + 0.5) return null;
  const top = measurer.getBoundingClientRect().top;
  const chars: { node: Text; offset: number }[] = [];
  const walker = document.createTreeWalker(measurer, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    for (let i = 0; i < text.data.length; i++) {
      if (text.data[i].trim()) chars.push({ node: text, offset: i });
    }
  }
  const range = document.createRange();
  const rectOf = (index: number) => {
    range.setStart(chars[index].node, chars[index].offset);
    range.setEnd(chars[index].node, chars[index].offset + 1);
    return range.getClientRects()[0] ?? range.getBoundingClientRect();
  };
  // Char boxes only move down in reading order: binary search the first char
  // that sticks out, then the first char of its line.
  const firstIndex = (test: (rect: DOMRect) => boolean) => {
    let lo = 0;
    let hi = chars.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (test(rectOf(mid))) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  };
  const overflowing = firstIndex(
    (rect) => rect.bottom - top > availablePx + 0.5,
  );
  if (overflowing >= chars.length) return null;
  const lineTop = rectOf(overflowing).top;
  const cut = firstIndex((rect) => rect.top >= lineTop - 0.5);

  const serialize = (fragment: DocumentFragment) => {
    const div = document.createElement("div");
    div.appendChild(fragment);
    return div.innerHTML;
  };
  range.setStart(measurer, 0);
  range.setEnd(chars[cut].node, chars[cut].offset);
  const before = cut === 0 ? "" : serialize(range.cloneContents());
  range.setStart(chars[cut].node, chars[cut].offset);
  range.setEnd(measurer, measurer.childNodes.length);
  return { before, after: serialize(range.cloneContents()) };
}

export function LetterFlowProvider(props: {
  letter: MonthlyData["letter"];
  slotIds: string[];
  layoutKey?: string;
  children: ReactNode;
}) {
  const letter = props.letter ?? { text: "" };
  const bodyEls = useRef(new Map<string, HTMLDivElement>());
  const [parts, setParts] = useState<Record<string, string> | null>(null);
  const [overflow, setOverflow] = useState(false);

  const depsKey = JSON.stringify([props.slotIds, props.layoutKey, letter]);
  useLayoutEffect(() => setParts(null), [depsKey]);

  useEffect(() => {
    let active = true;
    document.fonts?.ready.then(() => active && setParts(null));
    return () => {
      active = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (parts !== null) return;
    const result: Record<string, string> = {};
    let remaining = sanitizeLetterHtml(letter.text);
    for (const slotId of props.slotIds) {
      const body = bodyEls.current.get(slotId);
      result[slotId] = "";
      if (!body || !remaining) continue;
      const measurer = document.createElement("div");
      measurer.className = cn(BODY_CLASS, "invisible absolute inset-x-0 top-0");
      measurer.innerHTML = remaining;
      body.appendChild(measurer);
      const split = splitAtHeight(measurer, body.clientHeight);
      measurer.remove();
      if (!split) {
        result[slotId] = remaining;
        remaining = "";
      } else {
        result[slotId] = split.before;
        remaining = split.after;
      }
    }
    setParts(result);
    setOverflow(!!remaining);
  }, [parts, depsKey, letter.text, props.slotIds]);

  return (
    <Ctx.Provider
      value={{
        slotIds: props.slotIds,
        parts,
        overflow,
        registerBody: (id, el) =>
          el ? bodyEls.current.set(id, el) : bodyEls.current.delete(id),
      }}
    >
      <div
        style={{ display: "contents" }}
        {...(parts === null ? { "data-print-waiting": "" } : {})}
      >
        {props.children}
      </div>
    </Ctx.Provider>
  );
}

function LetterHeader() {
  return (
    <div className="flex items-center gap-[3mm]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LETTER_PORTRAIT}
        alt=""
        className="size-[12mm] shrink-0 rounded-full object-cover"
      />
      <div className="flex min-w-0 flex-col">
        <div className={cn(FLYER_TEXT.heading, "normal-case")}>
          {LETTER_TITLE}
        </div>
        <div className="opacity-60">{LETTER_AUTHOR}</div>
      </div>
    </div>
  );
}

/** The whole letter in one piece: poster, web view, any layout without flow. */
export function LetterView(props: { letter: MonthlyData["letter"] }) {
  if (!props.letter) return null;
  return (
    <div className="flex break-inside-avoid flex-col gap-2">
      <LetterHeader />
      <div
        className={BODY_CLASS}
        dangerouslySetInnerHTML={{
          __html: sanitizeLetterHtml(props.letter.text),
        }}
      />
    </div>
  );
}

/**
 * One LETTER frame. Inside a LetterFlowProvider it shows its share of the
 * text; elsewhere (poster, web) the first frame shows the whole letter and
 * continuation frames show nothing.
 */
export function LetterSlot(props: {
  id: string;
  letter: MonthlyData["letter"];
  isFirst: boolean;
  /** Editor only: warn on the last frame when the text did not fit. */
  showOverflowWarning?: boolean;
  emptyState?: ReactNode;
}) {
  const flow = useContext(Ctx);
  if (!flow) return props.isFirst ? <LetterView letter={props.letter} /> : null;

  const measuring = flow.parts === null;
  const part = flow.parts?.[props.id] ?? "";
  const isFirst = flow.slotIds[0] === props.id;
  const isLast = flow.slotIds[flow.slotIds.length - 1] === props.id;

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col gap-2",
        measuring && "grow",
      )}
    >
      {/* Header only on the first frame, rendered while measuring too so
          the measured free height excludes it. */}
      {isFirst && <LetterHeader />}
      <div
        ref={(el) => flow.registerBody(props.id, el)}
        className={cn("relative min-h-0 overflow-hidden", measuring && "grow")}
      >
        {!measuring &&
          (part ? (
            <div
              className={BODY_CLASS}
              dangerouslySetInnerHTML={{ __html: part }}
            />
          ) : (
            props.emptyState
          ))}
      </div>
      {/* Overlay, not in the flow: taking space after the split was measured
          would squeeze the frames and hide their last lines. */}
      {!measuring && props.showOverflowWarning && isLast && flow.overflow && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-md bg-red-100 px-2 py-1 text-xs text-red-800">
          Text passt nicht ganz — weiteren Rahmen „Wort des Pfarrers“ einfügen
          oder kürzen
        </div>
      )}
    </div>
  );
}
