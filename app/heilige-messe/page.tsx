import { Banner1 } from "@/app/banner1";
import { ErrBoundary } from "@/app/(shared)/ErrBoundary";
import { Links } from "@/app/(shared)/Links";
import { ContentHero, SectionIntro } from "@/components/ContentPage";
import Responsive from "@/components/Responsive";
import Site from "@/components/Site";
import { ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MASS_PARTS, PHOTOS, PILLARS, TIPS } from "./content";
import { MassFlow } from "./MassFlow";
import { NextMassPill, UpcomingMassList } from "./UpcomingMasses";

export const metadata: Metadata = {
  title: "Heilige Messe | Pfarre Emmaus am Wienerberg",
  description:
    "Die Heilige Messe ist das Herzstück unseres Glaubens. Was in der Messe passiert, wie sie abläuft und was Sie bei Ihrem ersten Besuch erwartet.",
  openGraph: {
    title: "Die Heilige Messe",
    description:
      "Das Herzstück unseres Glaubens. Sie sind herzlich eingeladen.",
    type: "website",
    images: PHOTOS.altar,
  },
};

const MAPS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=Tesarekplatz+2,+1100+Wien";

function Pillars() {
  return (
    <section className="pt-24 lg:pt-32">
      <SectionIntro title="Warum die Messe?">
        In der Messe begegnen wir Christus auf ganz besondere Weise. Sie ist die
        wichtigste Feier unseres Lebens: ein Ort, an dem wir innehalten,
        auftanken und erfahren, dass wir nicht allein unterwegs sind.
      </SectionIntro>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-xl"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${pillar.image})` }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="text-2xl font-bold italic">{pillar.title}</div>
              <p className="mt-2 text-white/90">{pillar.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FirstVisit() {
  return (
    <section id="erster-besuch" className="scroll-mt-8 pt-24 lg:pt-32">
      <SectionIntro title="Tipps für den Messbesuch">
        Egal, ob Sie schon lange dabei sind oder zum ersten Mal kommen, jeder
        ist herzlich willkommen. Ein paar Tipps, damit Sie sich gleich zu Hause
        fühlen.
      </SectionIntro>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-emmaus relative grid overflow-hidden rounded-xl text-white shadow-xl md:col-span-2 md:grid-cols-[1.2fr_1fr] lg:col-span-3">
          <div className="flex flex-col gap-3 p-8 lg:p-10">
            <div className="text-2xl font-bold italic">
              Kommunion oder Segen
            </div>
            <p className="text-lg leading-relaxed text-white/90">
              Wenn Sie katholisch sind und sich vorbereitet haben, können Sie
              den Leib Christi empfangen. Alle anderen sind genauso eingeladen,
              nach vorne zu kommen: Verschränken Sie die Arme vor der Brust, und
              der Priester spendet Ihnen einen Segen.
            </p>
          </div>
          <div
            className="min-h-56 bg-cover bg-center"
            style={{ backgroundImage: `url(${PHOTOS.chalice})` }}
          />
        </div>
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            className="rounded-xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur-sm"
          >
            <div className="text-lg font-semibold">{tip.title}</div>
            <p className="mt-1 text-neutral-600">{tip.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Visit() {
  return (
    <section className="pt-24 lg:pt-32">
      <SectionIntro title="Termine und Ort" />
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col rounded-xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur-sm lg:p-8">
          <div className="font-semibold">Nächste Heilige Messen</div>
          <div className="mt-3 grow">
            <ErrBoundary>
              <Suspense
                fallback={
                  <div className="flex flex-col gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-emmaus/20 h-8 animate-pulse rounded-lg"
                      />
                    ))}
                  </div>
                }
              >
                <UpcomingMassList />
              </Suspense>
            </ErrBoundary>
          </div>
          <Link
            href={Links.Termine}
            className="text-emmaus mt-6 inline-flex items-center gap-1.5 self-end font-semibold hover:underline"
          >
            Alle Termine <ArrowRight className="size-4" />
          </Link>
        </div>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="group relative block h-full min-h-80 overflow-hidden rounded-xl shadow-xl"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${PHOTOS.church})` }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white lg:p-8">
            <div className="text-2xl font-bold italic">
              Pfarre Emmaus am Wienerberg
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-white/90">
              <MapPin className="size-4" /> Tesarekplatz 2, 1100 Wien
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}

export default function HeiligeMessePage() {
  return (
    <Site responsive={false}>
      <ContentHero
        image={PHOTOS.altar}
        title="Die Heilige Messe"
        subtitle="Das Herzstück unseres Glaubens. Sie sind herzlich eingeladen."
      >
        <ErrBoundary>
          <Suspense>
            <NextMassPill />
          </Suspense>
        </ErrBoundary>
      </ContentHero>
      <Responsive>
        <Pillars />
        <section id="ablauf" className="scroll-mt-8 pt-24 lg:pt-32">
          <SectionIntro title="So läuft eine Messe ab">
            Die Messe folgt dem Weg der Emmaus-Jünger: Erst erschließt Jesus
            ihnen die Schrift, dann erkennen sie ihn beim Brechen des Brotes.
            Wort und Brot sind bis heute die beiden Herzstücke jeder Messe.
          </SectionIntro>
          <div className="mt-12 lg:mt-4">
            <MassFlow parts={MASS_PARTS} />
          </div>
        </section>
      </Responsive>
      <Banner1 text="Tut dies zu meinem Gedächtnis." image={PHOTOS.crucifix} />
      <Responsive>
        <FirstVisit />
        <Visit />
        <div className="pb-24 lg:pb-32" />
      </Responsive>
    </Site>
  );
}
