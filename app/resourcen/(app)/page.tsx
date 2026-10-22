import {
  APP_CARD_LINK,
  AppCard,
  AppFact,
  PageHeading,
  SectionHeading,
} from "@/components/intern/AppUI";
import { cn } from "@/util/utils";
import Link from "next/link";
import { ReactNode } from "react";
import {
  PiArrowSquareOut,
  PiDownloadSimple,
  PiFilePng,
  PiFileSvg,
  PiMicrosoftWordLogo,
} from "react-icons/pi";

export default function ResourcenPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8">
      <PageHeading
        title="Marke & Vorlagen"
        description="Logo, Farbe und Vorlagen für alles, was die Pfarre nach außen zeigt."
      />

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <AppCard className="grid place-items-center p-8">
          <img src="/logo.svg" alt="Logo" className="size-28" />
        </AppCard>
        <AppCard className="flex flex-col divide-y divide-neutral-100 px-6">
          <AppFact label="Bezeichnung">Pfarre Emmaus am Wienerberg</AppFact>
          <AppFact label="Farbe">
            <span className="flex items-center gap-2">
              <span className="bg-emmaus size-5 rounded" />
              Dunkelpetrol{" "}
              <span className="font-mono text-sm text-black/60">#3A7276</span>
            </span>
          </AppFact>
          <AppFact label="Schriftart">
            <Link
              href="https://fonts.google.com/specimen/Source+Sans+3"
              target="_blank"
              className="hover:text-emmaus flex items-center gap-1"
            >
              Source Sans 3 <PiArrowSquareOut />
            </Link>
          </AppFact>
        </AppCard>
      </div>

      <section>
        <SectionHeading title="Downloads" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Download href="/Emmaus_Vorlage.docx" icon={<PiMicrosoftWordLogo />}>
            Word-Vorlage
          </Download>
          <Download href="/logo.svg" icon={<PiFileSvg />}>
            Logo (SVG)
          </Download>
          <Download href="/logo.png" icon={<PiFilePng />}>
            Logo (PNG)
          </Download>
        </div>
      </section>
    </div>
  );
}

function Download(props: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={props.href}
      download
      className={cn(APP_CARD_LINK, "group flex items-center gap-3 p-4")}
    >
      <span className="bg-emmaus/10 text-emmaus grid size-10 shrink-0 place-items-center rounded-full text-xl">
        {props.icon}
      </span>
      <span className="grow font-medium">{props.children}</span>
      <PiDownloadSimple className="text-black/40 group-hover:text-black" />
    </a>
  );
}
