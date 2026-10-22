import { Links } from "@/app/(shared)/Links";
import { ContentHero, SectionIntro, Timeline } from "@/components/ContentPage";
import Responsive from "@/components/Responsive";
import Site from "@/components/Site";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CV, DUTIES, PHOTOS } from "./content";

export const metadata: Metadata = {
  title: "Pfarrer Dr. Zvonko Brezovski | Pfarre Emmaus am Wienerberg",
  description:
    "Aufgaben und Lebenslauf von Dr. Zvonko Brezovski, Pfarrer der Pfarre Emmaus am Wienerberg.",
  openGraph: {
    title: "Pfarrer Dr. Zvonko Brezovski",
    description: "Pfarrer der Pfarre Emmaus am Wienerberg.",
    type: "website",
    images: PHOTOS.portrait,
  },
};

export default function PfarrerPage() {
  return (
    <Site responsive={false}>
      <ContentHero
        image={PHOTOS.hero}
        title="Dr. Zvonko Brezovski"
        subtitle="Pfarrer der Pfarre Emmaus am Wienerberg."
      />
      <Responsive>
        <section className="grid gap-10 pt-24 lg:grid-cols-[2fr_3fr] lg:items-start lg:pt-32">
          <div className="overflow-hidden rounded-xl bg-white shadow-xl">
            <img
              src={PHOTOS.portrait}
              alt="Pfarrer Dr. Zvonko Brezovski"
              className="aspect-[4/5] w-full object-cover object-top"
            />
          </div>
          <div>
            <SectionIntro title="Seine Aufgaben">
              Unser Pfarrer leitet unsere Pfarre und trägt die spirituelle,
              organisatorische und pastorale Verantwortung.
            </SectionIntro>
            <dl className="mt-8 flex flex-col gap-5">
              {DUTIES.map((duty) => (
                <div key={duty.title}>
                  <dt className="font-semibold">{duty.title}</dt>
                  <dd className="mt-1 text-neutral-700">{duty.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="pt-24 lg:pt-32">
          <SectionIntro title="Lebenslauf" />
          <Timeline events={CV} />
        </section>

        <div className="pt-16 pb-24 lg:pb-32">
          <Link
            href={Links.Seite("gremien")}
            className="text-emmaus inline-flex items-center gap-1.5 font-semibold hover:underline"
          >
            <ArrowLeft className="size-4" /> Seelsorger und Gremien
          </Link>
        </div>
      </Responsive>
    </Site>
  );
}
