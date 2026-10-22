"use client";

import {
  DayGroup,
  EventDescriptionRenderer,
  TileHeading,
} from "@/app/monatsblatt/FlyerTiles";
import { TILE_ICONS } from "@/app/monatsblatt/tileIcons";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import { useLetterFlowSettled } from "@/app/monatsblatt/LetterFlow";
import { groupEventsByDate } from "@/domain/events/CalendarGrouper";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { cn } from "@/util/utils";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Events flow: distributes the event day-groups across a chain of "slots"
 * (EVENTS tiles on flyer panels), like linked text frames in DTP software.
 *
 * How it works (deterministic measurement, no heuristics):
 *  1. While no assignment exists, every slot renders ALL day-groups inside an
 *     invisible, absolutely-positioned measurer — at that slot's real width
 *     (panel widths differ: 100 mm vs 97 mm fold-in).
 *  2. A layout effect reads each slot's available height (the slot is a
 *     flex-grow child, so it reports the space left over by other tiles on
 *     the panel) and each group's height from the measurer.
 *  3. Groups are assigned to slots sequentially in reading order; whatever
 *     doesn't fit anywhere is reported as overflow (editor shows a warning).
 *  4. Re-measures when events/slots change and once fonts finish loading.
 *  5. Waits for the letter flow above to settle (see LetterFlow.tsx).
 *
 * Print contract: the provider carries `data-print-waiting` until the
 *  assignment is computed. The PDF render job waits until no such element
 *  exists before printing (see deploy/renderer/render.mjs), so the PDF never
 *  captures the measuring state. Editor and print run exactly this code.
 */

type Group = readonly [string, MonthlyData["events"]];

interface FlowContext {
  groups: Group[];
  liturgies: Liturgy[];
  slotIds: string[];
  assignment: Record<string, string[]> | null;
  /** Waiting for the letter flow to settle; slots must not stretch. */
  blocked: boolean;
  overflowCount: number;
  renderDescription?: EventDescriptionRenderer;
  registerSlot: (id: string, el: HTMLDivElement | null) => void;
  registerMeasurer: (id: string, el: HTMLDivElement | null) => void;
}

const Ctx = createContext<FlowContext | null>(null);

/**
 * True while the flow is measuring (slots must be stretched to expose the
 * panel's available height). After distribution, slots shrink to their
 * content so they don't block the rest of the panel.
 */
export function useEventsFlowMeasuring(): boolean {
  const flow = useContext(Ctx);
  return flow ? flow.assignment === null && !flow.blocked : false;
}

export function EventsFlowProvider(props: {
  events: MonthlyData["events"];
  liturgies: Liturgy[];
  /** EVENTS tile IDs in reading order (panel asc, order asc). */
  slotIds: string[];
  layoutKey?: string;
  /** Editor: makes the event descriptions editable (see FlyerTiles). */
  renderDescription?: EventDescriptionRenderer;
  children: ReactNode;
}) {
  const groups = useMemo(
    () =>
      Object.entries(groupEventsByDate(props.events ?? [])).filter(
        ([, events]) => events.length > 0,
      ),
    [props.events],
  );
  const slotEls = useRef(new Map<string, HTMLDivElement>());
  const measurerEls = useRef(new Map<string, HTMLDivElement>());
  const [assignment, setAssignment] = useState<Record<string, string[]> | null>(
    null,
  );
  const [overflowCount, setOverflowCount] = useState(0);

  // The letter flow distributes first (see LetterFlow.tsx); every new letter
  // distribution changes the space left for the events.
  const blocked = !useLetterFlowSettled();

  // Any content-relevant change invalidates the distribution.
  const depsKey = JSON.stringify([
    props.slotIds,
    props.layoutKey,
    groups,
    blocked,
  ]);
  useLayoutEffect(() => setAssignment(null), [depsKey]);

  // Fonts change text metrics; re-measure once they are ready.
  useEffect(() => {
    let active = true;
    document.fonts?.ready.then(() => active && setAssignment(null));
    return () => {
      active = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (assignment !== null || blocked) return;
    const result: Record<string, string[]> = {};
    let next = 0;
    for (const slotId of props.slotIds) {
      const slotEl = slotEls.current.get(slotId);
      const measurer = measurerEls.current.get(slotId);
      result[slotId] = [];
      if (!slotEl || !measurer) continue;
      const available = slotEl.clientHeight;
      const heights = Array.from(measurer.children).map(
        (el) => (el as HTMLElement).offsetHeight,
      );
      let used = 0;
      while (next < groups.length) {
        const h = heights[next] ?? 0;
        // Always place at least one group into an empty slot, otherwise a
        // single oversized day could stall the flow forever.
        if (used + h > available && result[slotId].length > 0) break;
        result[slotId].push(groups[next][0]);
        used += h;
        next += 1;
        if (used > available) break;
      }
    }
    setAssignment(result);
    setOverflowCount(groups.length - next);
  }, [assignment, blocked, depsKey, groups, props.slotIds]);

  return (
    <Ctx.Provider
      value={{
        groups,
        liturgies: props.liturgies,
        slotIds: props.slotIds,
        assignment,
        blocked,
        overflowCount,
        renderDescription: props.renderDescription,
        registerSlot: (id, el) =>
          el ? slotEls.current.set(id, el) : slotEls.current.delete(id),
        registerMeasurer: (id, el) =>
          el ? measurerEls.current.set(id, el) : measurerEls.current.delete(id),
      }}
    >
      <div
        style={{ display: "contents" }}
        {...(assignment === null ? { "data-print-waiting": "" } : {})}
      >
        {props.children}
      </div>
    </Ctx.Provider>
  );
}

/** One linked frame of the events flow (rendered by an EVENTS tile). */
export function EventsSlot(props: {
  id: string;
  /** Editor only: warn on the last slot when events did not fit. */
  showOverflowWarning?: boolean;
  /** What the editor of THIS layout can do about an overflow. */
  overflowAdvice?: string;
  emptyState?: ReactNode;
  /**
   * Take no space at all when the distribution left this slot empty. For
   * layouts whose slots are static (the A3 poster has one per column), where
   * an unused slot would otherwise offset everything below it by one gap.
   * Only safe for slots that aren't editable objects themselves.
   */
  collapseWhenEmpty?: boolean;
}) {
  const flow = useContext(Ctx);
  if (!flow) return null;
  const assigned = flow.assignment?.[props.id] ?? [];
  const isFirst = flow.slotIds[0] === props.id;
  const isLast = flow.slotIds[flow.slotIds.length - 1] === props.id;
  const measuring = flow.assignment === null && !flow.blocked;
  // While blocked the slot renders nothing but its heading: anything else
  // would take space the letter flow is measuring.
  const settled = flow.assignment !== null;
  // Never while measuring: the slot must expose the panel's free height then.
  const collapsed =
    settled && !!props.collapseWhenEmpty && !isFirst && !assigned.length;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        // Stretch only while measuring; afterwards the content defines the
        // height so following tiles/buttons move up.
        measuring && "grow",
        collapsed && "hidden",
      )}
    >
      {/* Heading only on the first frame of the chain. Rendered in BOTH
          states (measuring included) so its height is excluded from the
          measured available space below. */}
      {isFirst && (
        <div className="mb-2">
          <TileHeading icon={TILE_ICONS.EVENTS}>Termine</TileHeading>
        </div>
      )}
      <div
        ref={(el) => flow.registerSlot(props.id, el)}
        className={cn("relative min-h-0 overflow-hidden", measuring && "grow")}
      >
        {measuring && (
          <div
            ref={(el) => flow.registerMeasurer(props.id, el)}
            className="invisible absolute inset-x-0 top-0"
          >
            {flow.groups.map(([date, events]) => (
              <div key={date} className="">
                <DayGroup
                  dateString={date}
                  events={events}
                  liturgies={flow.liturgies}
                  renderDescription={flow.renderDescription}
                />
              </div>
            ))}
          </div>
        )}
        {settled && assigned.length === 0 && props.emptyState}
        {settled &&
          assigned.map((date) => {
            const group = flow.groups.find(([d]) => d === date);
            if (!group) return null;
            return (
              <div key={date} className="">
                <DayGroup
                  dateString={date}
                  events={group[1]}
                  liturgies={flow.liturgies}
                  renderDescription={flow.renderDescription}
                />
              </div>
            );
          })}
      </div>
      {settled &&
        props.showOverflowWarning &&
        isLast &&
        flow.overflowCount > 0 && (
          <div className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-800">
            +{flow.overflowCount} Tage passen nicht —{" "}
            {props.overflowAdvice ?? "weiteren Termin-Block einfügen"}
          </div>
        )}
    </div>
  );
}
