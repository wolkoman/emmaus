import { cn } from "@/util/utils";
import Link from "next/link";
import { ReactNode } from "react";
import { PiCaretDown } from "react-icons/pi";

/** Two panes inside AppShell: white sidebar (wide screens), content right. */
export function AppSidebarLayout(props: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block print:hidden">
        <nav className="sticky top-0 flex max-h-[calc(100dvh-3.5rem)] flex-col gap-1 overflow-y-auto p-3">
          {props.sidebar}
        </nav>
      </aside>
      <div className="min-w-0 grow">
        {/* Small screens have no sidebar: the same entries, collapsed. */}
        <details className="group border-b border-neutral-200 bg-white lg:hidden print:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
            Navigation
            <PiCaretDown className="transition group-open:rotate-180" />
          </summary>
          <nav className="flex flex-col gap-1 px-3 pb-3">{props.sidebar}</nav>
        </details>
        {props.children}
      </div>
    </div>
  );
}

export function AppSidebarSection(props: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 not-first:mt-4">
      {props.title && (
        <div className="mb-1 px-2 text-xs font-medium tracking-wide text-black/50 uppercase">
          {props.title}
        </div>
      )}
      {props.children}
    </div>
  );
}

/** Sidebar entry; without `href` a plain row (e.g. a legend item). */
export function AppSidebarLink(props: {
  href?: string;
  active?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  const className = cn(
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
    props.active ? "bg-emmaus/10 text-emmaus font-medium" : "text-black/70",
    props.href && !props.active && "hover:bg-black/5 hover:text-black",
  );
  const content = (
    <>
      <span className="shrink-0">{props.icon}</span>
      <span className="truncate">{props.children}</span>
    </>
  );
  return props.href ? (
    <Link
      href={props.href}
      aria-current={props.active ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
