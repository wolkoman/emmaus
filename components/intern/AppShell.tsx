import { Links } from "@/app/(shared)/Links";
import { cn } from "@/util/utils";
import Link from "next/link";
import { ContentLoading } from "@/components/intern/AppUI";
import { ReactNode } from "react";

/**
 * Full-screen frame of every internal app (Mein Bereich, Liturgische Dienste,
 * Monatsblatt, tools): fixed header, the page scrolls on a grey canvas below.
 * The header is a 1fr/auto/1fr grid so `center` stays centred whatever the
 * sides hold; on phones `center` moves to a second row.
 */
export function AppShell(props: {
  title: string;
  /** Where the logo leads; Mein Bereich itself points to the homepage. */
  backHref?: string;
  /** Tooltip of the logo link, when `backHref` isn't one of the defaults. */
  backLabel?: string;
  /** App menus next to the title (e.g. the Monatsblatt's menu bar). */
  menu?: ReactNode;
  center?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const backHref = props.backHref ?? Links.Intern;
  return (
    <div className="flex h-dvh flex-col print:block print:h-auto">
      <header className="grid shrink-0 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-b border-neutral-200 bg-white px-4 py-2.5 md:h-14 md:grid-cols-[1fr_auto_1fr] md:py-0 print:hidden">
        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            title={
              props.backLabel ??
              (backHref === Links.Intern
                ? "Zurück zu Mein Bereich"
                : "Zur Startseite")
            }
            className="flex shrink-0 items-center gap-2 font-semibold"
          >
            <img src="/logo.svg" alt={props.title} className="size-7" />
            {/* With a menu, the menu's own title names the app. */}
            {!props.menu && (
              <span className="hidden sm:inline">{props.title}</span>
            )}
          </Link>
          {props.menu && (
            <>
              <div className="h-6 w-px shrink-0 bg-neutral-200" />
              {props.menu}
            </>
          )}
        </div>
        {/* Phones have no room beside menu and actions: the switch gets its own row. */}
        {props.center && (
          <div className="col-span-2 row-start-2 flex justify-center md:col-span-1 md:col-start-2 md:row-start-1">
            {props.center}
          </div>
        )}
        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 md:col-start-3">
          {props.actions}
        </div>
      </header>
      <main className="grow overflow-auto bg-neutral-100 print:overflow-visible print:bg-white">
        {props.children}
      </main>
    </div>
  );
}

/** Segmented view switch for the header's centre. */
export function AppTabs<T extends string>(props: {
  label: string;
  tabs: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={props.label}
      className="flex rounded-md bg-neutral-100 p-0.5 text-sm"
    >
      {props.tabs.map(([id, title]) => (
        <button
          key={id}
          role="tab"
          aria-selected={props.value === id}
          className={cn(
            "rounded-sm px-4 py-1 whitespace-nowrap",
            props.value === id
              ? "bg-white font-medium shadow-xs"
              : "text-black/60 hover:text-black",
          )}
          onClick={() => props.onChange(id)}
        >
          {title}
        </button>
      ))}
    </div>
  );
}

/** Whole-app placeholder while a page (and its frame's data) loads. */
export function AppLoading(props: { title: string }) {
  return (
    <AppShell title={props.title}>
      <ContentLoading />
    </AppShell>
  );
}

/** Quiet text link for the header's actions (e.g. "Abmelden"). */
export function AppHeaderLink(props: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={props.href}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-black/60 hover:bg-black/5 hover:text-black"
    >
      {props.icon} {props.children}
    </Link>
  );
}
