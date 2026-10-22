import { Banner1 } from "@/app/banner1";
import { ContentHero, SectionIntro } from "@/components/ContentPage";
import Responsive from "@/components/Responsive";
import Site from "@/components/Site";
import { Download } from "lucide-react";
import type { Metadata } from "next";
import { PHOTOS, SONGS } from "./content";

export const metadata: Metadata = {
  title: "Emmaus-Messe | Pfarre Emmaus am Wienerberg",
  description:
    "Die Emmaus-Messe ist in unserer Pfarre entstanden. Texte von Walter Krieger, Musik von Sylvia Schachinger und Johann Kießling. Alle Noten zum Herunterladen.",
  openGraph: {
    title: "Die Emmaus-Messe",
    description: "Musik aus unserer Pfarre, mit allen Noten.",
    type: "website",
    images: PHOTOS.congregation,
  },
};

const CREDITS = [
  { label: "Texte", value: "Walter Krieger" },
  { label: "Musik", value: "Sylvia Schachinger und Johann Kießling" },
  { label: "Erstmals gesungen", value: "Ostermontag 2023" },
];

export default function EmmausMessePage() {
  return (
    <Site responsive={false}>
      <ContentHero
        image={PHOTOS.congregation}
        title="Die Emmaus-Messe"
        subtitle="Musik aus unserer Pfarre."
      />
      <Responsive>
        <section className="grid gap-10 pt-24 lg:grid-cols-2 lg:pt-32">
          <SectionIntro title="Entstanden in unserer Pfarre">
            Die Emmaus-Messe ist in unserer Pfarre Emmaus am Wienerberg
            entstanden. Seit ihrer ersten Aufführung singen wir ihre Lieder
            immer wieder in unseren Gottesdiensten.
          </SectionIntro>
          <dl className="flex flex-col divide-y divide-black/5 self-end rounded-xl border border-black/5 bg-white/70 px-6 shadow-sm backdrop-blur-sm">
            {CREDITS.map((credit) => (
              <div key={credit.label} className="py-4">
                <dt className="text-sm text-neutral-500">{credit.label}</dt>
                <dd className="font-semibold">{credit.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="pt-24 pb-24 lg:pt-32 lg:pb-32">
          <SectionIntro title="Die Lieder">
            Alle Noten zum Herunterladen. Die Lieder sind für kirchliche Zwecke
            jederzeit frei verwendbar.
          </SectionIntro>
          <ol className="mt-10 flex flex-col divide-y divide-black/5 rounded-xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-sm">
            {SONGS.map((song, i) => (
              <li key={song.title}>
                <a
                  href={song.pdf}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-black/[0.03]"
                >
                  <span className="w-6 shrink-0 text-neutral-400 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="grow font-semibold">{song.title}</span>
                  <span className="text-emmaus inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
                    <Download className="size-4" /> Noten (PDF)
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      </Responsive>
      <Banner1
        text="Bleib doch bei uns; denn es wird bald Abend."
        image={PHOTOS.church}
      />
      <div className="pb-24 lg:pb-32" />
    </Site>
  );
}
