import { Links } from "@/app/(shared)/Links";
import { AppShell } from "@/components/intern/AppShell";
import { cn } from "@/util/utils";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

/**
 * Layout of the internal area. Signed-in pages use the app frame (AppShell);
 * InternShell is the standalone screen for login/logout.
 */

/** Standalone screen (login/logout): logo link home, the page, a footer. */
export function InternShell(props: {
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50 print:bg-white">
      <header className="flex items-center justify-between gap-4 p-6 print:hidden">
        <Link
          href={Links.Hauptseite}
          className="inline-flex items-center gap-2 text-sm font-semibold text-black/70 hover:text-black"
        >
          <Image src="/logo.svg" alt="" width={24} height={24} />
          Pfarre Emmaus am Wienerberg
        </Link>
      </header>
      {props.children}
      {props.footer && (
        <footer className="px-6 pb-6 text-center text-sm text-black/50 print:hidden">
          {props.footer}
        </footer>
      )}
    </div>
  );
}

const WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-5xl",
  full: "",
};

/** Standard internal page: the app frame with a content column. */
export function InternPage(props: {
  title: string;
  description?: string;
  /** "full" for editors that lay out their own wide canvas. */
  width?: keyof typeof WIDTHS;
  backHref?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell
      title={props.title}
      backHref={props.backHref}
      actions={props.actions}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6 px-4 py-8 print:p-0",
          WIDTHS[props.width ?? "md"],
        )}
      >
        {props.description && (
          <p className="text-black/60 print:hidden">{props.description}</p>
        )}
        {props.children}
      </div>
    </AppShell>
  );
}
