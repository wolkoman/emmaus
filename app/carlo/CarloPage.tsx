import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Site from "@/components/Site";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import { PiArrowRightBold } from "react-icons/pi";
import {
  carloPath,
  formatDay,
  formatTime,
  LIVE_LANGS,
  LIVE_TEXT,
  LiveLang,
} from "./i18n";
import { LiveStatus } from "./LiveStatus";
import {
  FILM_START,
  LIVESTREAM,
  MEETING_START,
  TICKET_URL,
} from "./livestream";

export function carloMetadata(lang: LiveLang): Metadata {
  const text = LIVE_TEXT[lang];
  const description = `${text.lead} ${formatDay(LIVESTREAM.start, lang)}.`;
  return {
    title: `${text.heading} – Pfarre Emmaus am Wienerberg`,
    description,
    alternates: {
      languages: {
        ...Object.fromEntries(
          LIVE_LANGS.map((l) => [LIVE_TEXT[l].locale, carloPath(l)]),
        ),
        "x-default": "/carlo",
      },
    },
    openGraph: {
      title: text.heading,
      description,
      type: "website",
      url: carloPath(lang),
      locale: text.locale.replace("-", "_"),
    },
  };
}

export function CarloPage({ lang }: { lang: LiveLang }) {
  const text = LIVE_TEXT[lang];
  const { programme } = text;
  return (
    <Site>
      <div lang={lang} className="mx-auto w-full max-w-4xl pt-4 pb-24 lg:pt-8">
        <LanguageLinks lang={lang} />
        <h1 className="mt-6 text-5xl font-bold tracking-tight italic lg:text-7xl">
          {text.heading}
        </h1>
        <p className="mt-4 text-xl lg:text-2xl">{text.lead}</p>
        <p className="mt-1 text-xl font-semibold lg:text-2xl">
          {formatDay(LIVESTREAM.start, lang)}
        </p>

        <Card variant="emmaus" className="mt-10 py-6 text-base lg:text-lg">
          <CardContent className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-6 px-6">
            <ProgrammeItem
              time={formatTime(LIVESTREAM.start, lang)}
              title={programme.mass}
              place={programme.parish}
              note={programme.massNote}
            />
            <ProgrammeItem
              time={formatTime(MEETING_START, lang)}
              title={programme.meeting}
              place={programme.parish}
            />
            <ProgrammeItem
              time={formatTime(FILM_START, lang)}
              title={programme.film}
              place={programme.cinema}
            >
              {TICKET_URL ? (
                <a href={TICKET_URL} target="_blank" rel="noreferrer">
                  <Button>
                    {text.tickets.link} <PiArrowRightBold />
                  </Button>
                </a>
              ) : (
                <p>{text.tickets.soon}</p>
              )}
            </ProgrammeItem>
          </CardContent>
        </Card>

        <h2 className="mt-16 text-3xl font-bold">{text.livestreamHeading}</h2>
        <div className="mt-6">
          <LiveStatus
            lang={lang}
            start={LIVESTREAM.start}
            streamUrl={LIVESTREAM.streamUrl}
            recordingUrl={LIVESTREAM.recordingUrl}
          />
        </div>
      </div>
    </Site>
  );
}

function ProgrammeItem(props: {
  time: string;
  title: string;
  place: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <div className="contents">
      <div className="font-semibold tabular-nums">{props.time}</div>
      <div>
        <div>{props.title}</div>
        <div className="text-neutral-600">{props.place}</div>
        {props.note && <div className="text-neutral-600">{props.note}</div>}
        {props.children && <div className="mt-3">{props.children}</div>}
      </div>
    </div>
  );
}

function LanguageLinks({ lang }: { lang: LiveLang }) {
  return (
    <nav className="flex flex-wrap justify-end gap-x-4 gap-y-1">
      {LIVE_LANGS.map((l) =>
        l === lang ? (
          <span key={l} lang={l} className="font-semibold">
            {LIVE_TEXT[l].languageName}
          </span>
        ) : (
          <Link
            key={l}
            href={carloPath(l)}
            lang={l}
            hrefLang={l}
            className="underline hover:no-underline"
          >
            {LIVE_TEXT[l].languageName}
          </Link>
        ),
      )}
    </nav>
  );
}
