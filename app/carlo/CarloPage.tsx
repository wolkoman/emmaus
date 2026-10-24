import { Button } from "@/components/ui/button";
import Site from "@/components/Site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { PiArrowRightBold } from "react-icons/pi";
import {
  carloPath,
  formatDateParts,
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
  const date = formatDateParts(LIVESTREAM.start, lang);
  const [beforeMother, afterMother] = text.lead.split(text.mother);
  return (
    <Site responsive={false} dark>
      <div
        lang={lang}
        className="relative overflow-hidden bg-[#2b6265] text-white"
      >
        <div className="absolute inset-x-0 top-0 h-[26rem] sm:h-[34rem] lg:h-[44rem]">
          <Image
            src="/carlo/carlo-acutis.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_15%]"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent from-35% to-[#2b6265] to-95%" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-4 pt-20 pb-20 lg:pt-24 lg:pb-28">
          {/* On phones the picker would cover Carlo's face, so it moves below the lead there. */}
          <LanguageLinks lang={lang} className="ml-auto hidden sm:flex" />
          <h1 className="mt-48 text-5xl leading-[0.95] font-bold tracking-tight text-balance italic drop-shadow-sm sm:mt-60 sm:text-7xl lg:mt-[22rem] lg:text-8xl">
            {text.motto}
          </h1>
          <p className="mt-6 max-w-3xl text-2xl leading-snug lg:text-3xl">
            {afterMother === undefined ? (
              text.lead
            ) : (
              <>
                {beforeMother}
                <span className="font-semibold text-[#aadcd8]">
                  {text.mother}
                </span>
                {afterMother}
              </>
            )}
          </p>
          <LanguageLinks lang={lang} className="mt-6 flex sm:hidden" />

          <div className="mt-12 grid gap-8 md:grid-cols-[auto_1fr] md:gap-0 lg:mt-16">
            <div className="md:border-r md:border-white/30 md:pr-12">
              <div className="text-3xl capitalize lg:text-4xl">
                {date.weekday}
              </div>
              <div className="text-5xl font-bold tracking-tight whitespace-nowrap sm:text-6xl text-[#aadcd8] italic lg:text-8xl">
                {date.day}
              </div>
            </div>
            <div className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-6 text-lg md:pl-12 lg:text-xl">
              <ProgrammeItem
                time={formatTime(LIVESTREAM.start, lang)}
                title={programme.mass}
                place={programme.parish}
                note={programme.massNote}
                live={text.live}
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
                    <Button size="lg" className={ticketButton}>
                      {text.tickets.link} <PiArrowRightBold />
                    </Button>
                  </a>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      disabled
                      aria-describedby="tickets-soon"
                      className={ticketButton}
                    >
                      {text.tickets.link} <PiArrowRightBold />
                    </Button>
                    <span
                      id="tickets-soon"
                      role="tooltip"
                      className="relative rounded-md bg-[#aadcd8] px-3 py-1.5 text-xs text-[#2b6265]"
                    >
                      <span className="absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rotate-45 rounded-[2px] bg-[#aadcd8]" />
                      {text.tickets.soon}
                    </span>
                  </div>
                )}
              </ProgrammeItem>
            </div>
          </div>

          <h2 className="mt-20 text-3xl font-bold lg:mt-28 lg:text-4xl">
            {text.livestreamHeading}
          </h2>
          <div className="mt-6">
            <LiveStatus
              lang={lang}
              start={LIVESTREAM.start}
              streamUrl={LIVESTREAM.streamUrl}
              recordingUrl={LIVESTREAM.recordingUrl}
            />
          </div>
        </div>
      </div>
    </Site>
  );
}

const ticketButton =
  "bg-white px-4 text-base font-semibold text-[#2b6265] hover:bg-white/85";

function ProgrammeItem(props: {
  time: string;
  title: string;
  place: string;
  note?: string;
  live?: string;
  children?: ReactNode;
}) {
  return (
    <div className="contents">
      <div className="font-semibold text-[#aadcd8] tabular-nums">
        {props.time}
      </div>
      <div>
        <div>
          {props.title}
          {props.live && (
            <span className="ml-2 inline-flex items-center gap-1.5 align-middle text-sm font-semibold tracking-wide text-[#aadcd8] uppercase">
              <span className="size-2 rounded-full bg-[#aadcd8]" />
              {props.live}
            </span>
          )}
        </div>
        <div className="text-base text-white/70 italic">{props.place}</div>
        {props.note && (
          <div className="text-base text-white/70 italic">{props.note}</div>
        )}
        {props.children && <div className="mt-4">{props.children}</div>}
      </div>
    </div>
  );
}

function LanguageLinks({
  lang,
  className,
}: {
  lang: LiveLang;
  className: string;
}) {
  return (
    <nav
      className={`w-fit flex-wrap gap-x-4 gap-y-1 rounded-full bg-black/30 px-4 py-1.5 backdrop-blur-sm ${className}`}
    >
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
