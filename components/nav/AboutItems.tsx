"use server";
import { fetchEmmausSites } from "@/app/(shared)/Sites";
import { Links } from "@/app/(shared)/Links";
import { PHOTOS as EMMAUS_MESSE_PHOTOS } from "@/app/emmaus-messe/content";
import { PHOTOS as GESCHICHTE_PHOTOS } from "@/app/geschichte/content";
import { PHOTOS as GREMIEN_PHOTOS } from "@/app/gremien/content";
import { PHOTOS as MESSE_PHOTOS } from "@/app/heilige-messe/content";
import Link from "next/link";
import React, { cache } from "react";

const fetchEmmausS = cache(() => fetchEmmausSites());

async function topLevelSites() {
  const sites = await fetchEmmausS();
  return sites.filter((site) => site.level === 0);
}

const CARD_PHOTOS: Record<string, string> = {
  "heilige-messe": MESSE_PHOTOS.altar,
  geschichte: GESCHICHTE_PHOTOS.church,
  "emmaus-messe": EMMAUS_MESSE_PHOTOS.congregation,
  gremien: GREMIEN_PHOTOS.pastor,
  chor: MESSE_PHOTOS.music,
};

function AboutCard({
  site,
  large,
  compact,
}: {
  site: { slug: string; title: string; summary: string };
  large: boolean;
  compact?: boolean;
}) {
  const photo = CARD_PHOTOS[site.slug];
  return (
    <Link
      href={Links.Seite(site.slug)}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-lg p-3 text-white ${
        compact
          ? large
            ? "col-span-2 min-h-32"
            : "min-h-24"
          : large
            ? "row-span-2 min-h-72"
            : "min-h-36"
      }`}
    >
      <div
        className="absolute inset-0 bg-neutral-300 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={photo ? { backgroundImage: `url(${photo})` } : undefined}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
      <div className={`relative font-bold italic ${large ? "text-xl" : ""}`}>
        {site.title}
      </div>
      {!compact && (
        <div className="relative text-sm leading-snug text-white/85">
          {site.summary}
        </div>
      )}
    </Link>
  );
}

/** Desktop "Über uns" panel: every page as a photo card, the Mass larger. */
export async function AboutMenu() {
  const sites = await topLevelSites();
  return (
    <div className="grid w-[640px] grid-cols-3 grid-rows-2 gap-2">
      {sites.map((site, i) => (
        <AboutCard key={site._id} site={site} large={i === 0} />
      ))}
    </div>
  );
}

/** Mobile menu: the same cards, titles only, two per row. */
export async function AboutCards() {
  const sites = await topLevelSites();
  return (
    <div className="grid grid-cols-2 gap-2">
      {sites.map((site, i) => (
        <AboutCard key={site._id} site={site} large={i === 0} compact />
      ))}
    </div>
  );
}
