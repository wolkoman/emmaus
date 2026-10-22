"use client";

import { Play } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { LIVE_TEXT, LiveLang, unitLabel } from "./i18n";
import { LIVESTREAM_ENDS_AFTER } from "./livestream";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// "Der Stream startet hier kurz vor Beginn": show the embed a bit early.
const EMBED_LEAD = 15 * MINUTE;

export function LiveStatus(props: {
  lang: LiveLang;
  start: string;
  streamUrl: string;
  recordingUrl: string;
}) {
  const lang = props.lang;
  const now = useNow();
  const start = Date.parse(props.start);

  if (now === undefined) return <Countdown lang={lang} />;
  if (now >= start + LIVESTREAM_ENDS_AFTER)
    return <Ended lang={lang} url={props.recordingUrl} />;
  if (props.streamUrl && now >= start - EMBED_LEAD)
    return <Stream lang={lang} url={props.streamUrl} />;
  if (now >= start) return <StartingSoon lang={lang} />;
  return <Countdown lang={lang} remaining={start - now} />;
}

/** Ticks every second; `?zeit=<ISO-Zeitpunkt>` simulates another moment for testing. */
function useNow() {
  const [now, setNow] = useState<number>();
  useEffect(() => {
    const simulated = Date.parse(
      new URLSearchParams(window.location.search).get("zeit") ?? "",
    );
    const offset = Number.isNaN(simulated) ? 0 : simulated - Date.now();
    const tick = () => setNow(Date.now() + offset);
    tick();
    const interval = setInterval(tick, SECOND);
    return () => clearInterval(interval);
  }, []);
  return now;
}

/** A video frame; until the stream starts it is a placeholder showing the state. */
function Player({ children }: { children: ReactNode }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900 text-white shadow-xl">
      {children}
    </div>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <Player>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center sm:gap-4">
        {children}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-linear-to-t from-black/60 to-transparent px-4 pt-6 pb-3 text-white/40">
        <Play className="size-4 fill-current" />
        <div className="h-1 grow rounded-full bg-white/20" />
      </div>
    </Player>
  );
}

function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="bg-emmaus inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-lg font-semibold text-white hover:opacity-90 sm:w-auto"
    >
      {children}
    </a>
  );
}

function Countdown({
  lang,
  remaining,
}: {
  lang: LiveLang;
  remaining?: number;
}) {
  const text = LIVE_TEXT[lang];
  const units = [
    { size: DAY, labels: text.units.days },
    { size: HOUR, labels: text.units.hours },
    { size: MINUTE, labels: text.units.minutes },
    { size: SECOND, labels: text.units.seconds },
  ];
  let rest = Math.max(0, remaining ?? 0);
  return (
    <Placeholder>
      <p className="text-sm text-white/70 sm:text-lg">{text.notYet}</p>
      {/* Invisible until mounted, so the server never renders a time. */}
      <div
        className={`grid grid-cols-4 gap-4 sm:gap-8 ${remaining === undefined ? "invisible" : ""}`}
      >
        {units.map((unit, i) => {
          const value = Math.floor(rest / unit.size);
          rest -= value * unit.size;
          return (
            <div key={unit.size}>
              <div className="text-4xl font-bold tabular-nums sm:text-6xl lg:text-7xl">
                {i === 0 ? value : String(value).padStart(2, "0")}
              </div>
              <div className="text-xs text-white/70 sm:text-base">
                {unitLabel(unit.labels, value, lang)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="hidden text-white/70 sm:block">{text.startsHere}</p>
    </Placeholder>
  );
}

function StartingSoon({ lang }: { lang: LiveLang }) {
  // A stream URL added after this page was loaded only arrives with a reload.
  useEffect(() => {
    const timeout = setTimeout(() => window.location.reload(), MINUTE);
    return () => clearTimeout(timeout);
  }, []);
  return (
    <Placeholder>
      <p className="text-2xl font-bold sm:text-4xl">
        {LIVE_TEXT[lang].startingSoon}
      </p>
    </Placeholder>
  );
}

function Stream({ lang, url }: { lang: LiveLang; url: string }) {
  const embedUrl = youTubeEmbedUrl(url);
  return (
    <div className="flex flex-col gap-4">
      {embedUrl && (
        <Player>
          <iframe
            src={embedUrl}
            title="Livestream"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full"
          />
        </Player>
      )}
      <div className="text-center">
        <LinkButton href={url}>{LIVE_TEXT[lang].openStream}</LinkButton>
      </div>
    </div>
  );
}

function Ended({ lang, url }: { lang: LiveLang; url: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Placeholder>
        <p className="text-2xl font-bold sm:text-4xl">
          {LIVE_TEXT[lang].thanks}
        </p>
      </Placeholder>
      {url && (
        <div className="text-center">
          <LinkButton href={url}>{LIVE_TEXT[lang].recording}</LinkButton>
        </div>
      )}
    </div>
  );
}

function youTubeEmbedUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  const host = parsed.hostname.replace(/^(www|m)\./, "");
  const id =
    host === "youtu.be"
      ? parsed.pathname.slice(1)
      : host === "youtube.com"
        ? (parsed.searchParams.get("v") ??
          parsed.pathname.match(/^\/(?:live|embed)\/([\w-]+)/)?.[1])
        : undefined;
  return id ? `https://www.youtube.com/embed/${id}` : undefined;
}
