"use client";

import { LIVE_LANGS, LIVE_TEXT, LiveLang, carloPath } from "@/app/carlo/i18n";
import { LIVESTREAM, LIVESTREAM_ENDS_AFTER } from "@/app/carlo/livestream";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Points visitors whose browser prefers a language of the Mass to the livestream in that language. */
export function LiveLanguageBanner() {
  const [lang, setLang] = useState<LiveLang>();

  // Read after mount: the browser language is unknown while the page is cached and server-rendered.
  useEffect(() => {
    const ended =
      Date.now() > Date.parse(LIVESTREAM.start) + LIVESTREAM_ENDS_AFTER;
    if (ended || window.location.pathname.startsWith("/carlo")) return;
    const preferred = (navigator.languages?.[0] ?? navigator.language)
      .slice(0, 2)
      .toLowerCase();
    const match = LIVE_LANGS.find((l) => l === preferred);
    if (match && LIVE_TEXT[match].banner) setLang(match);
  }, []);

  const banner = lang && LIVE_TEXT[lang].banner;
  if (!lang || !banner) return null;
  return (
    <div lang={lang} className="bg-emmaus px-4 py-2 text-center text-white">
      {banner.text}{" "}
      <Link
        href={carloPath(lang)}
        hrefLang={lang}
        className="font-semibold underline hover:no-underline"
      >
        {banner.link}
      </Link>
    </div>
  );
}
