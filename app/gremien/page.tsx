import { Links } from "@/app/(shared)/Links";
import { ContentHero, SectionIntro } from "@/components/ContentPage";
import Responsive from "@/components/Responsive";
import Site from "@/components/Site";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { COUNCILS, PHOTOS } from "./content";

export const metadata: Metadata = {
  title: "Seelsorger und Gremien | Pfarre Emmaus am Wienerberg",
  description:
    "Pfarrer, Kaplan, Pfarrgemeinderat und Vermögensverwaltungsrat der Pfarre Emmaus am Wienerberg.",
  openGraph: {
    title: "Seelsorger und Gremien",
    description: "Wer unsere Pfarre leitet und mitgestaltet.",
    type: "website",
    images: PHOTOS.pastor,
  },
};

const card =
  "rounded-xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-sm";

export default function GremienPage() {
  return (
    <Site responsive={false}>
      <ContentHero
        image={PHOTOS.pastor}
        title="Seelsorger und Gremien"
        subtitle="Wer unsere Pfarre leitet und mitgestaltet."
      />
      <Responsive>
        <section className="pt-24 lg:pt-32">
          <SectionIntro title="Die Seelsorger" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_3fr] lg:items-center">
            <div className="overflow-hidden rounded-xl bg-white shadow-xl">
              <img
                src={PHOTOS.portrait}
                alt="Pfarrer Dr. Zvonko Brezovski"
                className="aspect-[4/5] w-full object-cover object-top"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold italic">
                Pfarrer Dr. Zvonko Brezovski
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-pretty text-neutral-700">
                Unser Pfarrer leitet die Pfarrgemeinde und trägt die
                Gesamtverantwortung für das spirituelle, pastorale und
                organisatorische Leben in der Pfarre. Er feiert die
                Gottesdienste, spendet die Sakramente, begleitet die
                Gemeindemitglieder und koordiniert die pastoralen Aktivitäten.
                Er ist Ansprechpartner für den Pfarrgemeinderat und den
                Vermögensverwaltungsrat und sorgt dafür, dass pastorale und
                administrative Belange im Einklang sind.
              </p>
              <Link
                href={Links.Seite("zvonko-brezovski")}
                className="text-emmaus mt-4 inline-flex items-center gap-1.5 font-semibold hover:underline"
              >
                Lebenslauf <ArrowRight className="size-4" />
              </Link>

              <h3 className="mt-12 text-2xl font-bold italic">
                Kaplan Romaric
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-pretty text-neutral-700">
                Unser Kaplan unterstützt den Pfarrer in seinen Aufgaben und
                wirkt vor allem in der Seelsorge und bei der Feier der
                Sakramente mit. Er arbeitet eng mit dem Pfarrer und den Gremien
                zusammen.
              </p>
            </div>
          </div>
        </section>

        <section className="pt-24 pb-24 lg:pt-32 lg:pb-32">
          <SectionIntro title="Die Gremien der Pfarre" />
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            {COUNCILS.map((council) => (
              <div key={council.short} className="flex flex-col">
                <h3 className="text-2xl font-bold italic">
                  {council.title} ({council.short})
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-pretty text-neutral-700">
                  {council.text}
                </p>
                <div className={`mt-6 px-6 py-2 ${card}`}>
                  {council.groups.map((group, i) => (
                    <div key={i} className="py-3">
                      {"label" in group && (
                        <div className="pb-1 text-sm text-neutral-500">
                          {group.label}
                        </div>
                      )}
                      <ul className="divide-y divide-black/5">
                        {group.members.map((member) => (
                          <li
                            key={member.name}
                            className="flex items-baseline justify-between gap-4 py-2"
                          >
                            <span className="font-semibold">{member.name}</span>
                            {"role" in member && (
                              <span className="text-sm text-neutral-500">
                                {member.role}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Responsive>
    </Site>
  );
}
