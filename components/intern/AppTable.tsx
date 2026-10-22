import { cn } from "@/util/utils";
import { ReactNode } from "react";

/**
 * Flat, dense data table for the internal apps (duty plan, duty lists,
 * articles). Rows are CSS grids: callers pass the same `grid-cols-*` class
 * to AppTableHeader and AppTableRow so the columns line up. Every row sizes
 * its own grid, so columns must not be `auto` (content-sized): use fixed
 * widths or fr, or the header drifts from the rows.
 */
export function AppTable(props: {
  /** Edge to edge, for a table that is the view's only content. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-flush={props.flush || undefined}
      className={cn(
        "group/table bg-white",
        !props.flush && "rounded-md border border-neutral-200",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

/** Column labels; sticks to the top of the scrolling canvas. */
export function AppTableHeader(props: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 rounded-t-md border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-black/50 group-data-flush/table:rounded-none",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

/** Label row that groups the rows below it (e.g. a month). */
export function AppTableGroup(props: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={props.id}
      className={cn(
        "scroll-mt-10 border-b border-neutral-200 bg-neutral-50/60 px-3 py-1.5 text-sm font-semibold",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

export function AppTableRow(props: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-b border-neutral-100 px-3 py-2 last:border-b-0 hover:bg-neutral-50/60",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
