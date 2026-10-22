import { cn } from "@/util/utils";
import { ReactNode } from "react";
import { PiSpinner } from "react-icons/pi";

/**
 * Building blocks of the internal apps (see AppShell). Pages compose these
 * instead of repeating the classes, so the apps can't drift apart.
 */

/** White surface on the grey canvas. Exported for links styled as cards. */
export const APP_CARD = "rounded-md border border-neutral-200 bg-white";

/** APP_CARD for a whole-card link: flat hover, no lifting. */
export const APP_CARD_LINK = cn(
  APP_CARD,
  "transition-colors hover:border-neutral-300 hover:bg-neutral-50",
);

export function AppCard(props: { className?: string; children: ReactNode }) {
  return <div className={cn(APP_CARD, props.className)}>{props.children}</div>;
}

/** Page title with one muted line of context. */
export function PageHeading(props: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="print:hidden">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {props.title}
      </h1>
      {props.description && (
        <p className="mt-1 text-black/60">{props.description}</p>
      )}
    </div>
  );
}

/** Heading of a group on the canvas, e.g. above a card. */
export function SectionHeading(props: {
  title: ReactNode;
  description?: ReactNode;
  /** Stays visible while its section scrolls (long lists like the plan). */
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-3",
        props.sticky &&
          "sticky top-0 z-10 -mx-2 bg-neutral-100/90 px-2 py-2 backdrop-blur",
      )}
    >
      <h2 className="text-lg font-semibold">{props.title}</h2>
      {props.description && (
        <p className="mt-1 text-sm text-black/60">{props.description}</p>
      )}
    </div>
  );
}

/** Spinner for the content area while the frame around it stays. */
export function ContentLoading() {
  return (
    <div className="grid h-52 place-items-center">
      <PiSpinner className="animate-spin" />
    </div>
  );
}

/** Label/value row; stack them in a divided AppCard. */
export function AppFact(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="text-sm text-black/60">{props.label}</span>
      <span className="text-right font-medium">{props.children}</span>
    </div>
  );
}

/**
 * Choose one of a few values (font size, article status). Only usable from
 * client components, it takes an onChange handler.
 */
export function AppSegmented<T extends string | number>(props: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={props.label}
      className="flex flex-wrap rounded-md border border-neutral-200 bg-white p-0.5 text-sm"
    >
      {props.options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={props.value === option.value}
          disabled={props.disabled}
          className={cn(
            "rounded-sm px-2.5 py-0.5 disabled:opacity-50",
            props.value === option.value
              ? "bg-neutral-900 text-white"
              : "hover:bg-black/5",
          )}
          onClick={() => props.onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
