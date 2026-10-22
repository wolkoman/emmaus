import { Banner1 } from "@/app/banner1";
import { ContentHero, SectionIntro, Timeline } from "@/components/ContentPage";
import Responsive from "@/components/Responsive";
import Site from "@/components/Site";
import type { Metadata } from "next";
import {
  CHURCH,
  EMMAUS_PASSAGE,
  EVENTS,
  PHOTOS,
  SETTLEMENT,
  SETTLEMENT_IMAGES,
  SOURCES,
} from "./content";

export const metadata: Metadata = {
  title: "Geschichte | Pfarre Emmaus am Wienerberg",
  description:
    "Von den Wienerberger Ziegelwerken zur Pfarre: die Geschichte der Siedlung, die Architektur der Kirche und der Ursprung des Namens Emmaus.",
  openGraph: {
    title: "Unsere Geschichte",
    description: "Die Geschichte der Pfarre Emmaus am Wienerberg.",
    type: "website",
    images: PHOTOS.church,
  },
};

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="mt-6 flex max-w-2xl flex-col gap-4 text-lg leading-relaxed text-pretty text-neutral-700">
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 20)}>{paragraph}</p>
      ))}
    </div>
  );
}

function Figure({
  src,
  caption,
  source,
}: {
  src: string;
  caption: string;
  source: string;
}) {
  return (
    <figure className="mt-6">
      <img
        src={src}
        alt={caption}
        className="w-full rounded-xl shadow-xl"
        loading="lazy"
      />
      <figcaption className="mt-2 text-sm text-neutral-500">
        {caption} (
        <a
          href={source}
          target="_blank"
          rel="noreferrer"
          className="underline hover:no-underline"
        >
          Wikimedia Commons
        </a>
        )
      </figcaption>
    </figure>
  );
}

export default function GeschichtePage() {
  return (
    <Site responsive={false}>
      <ContentHero
        image={PHOTOS.congregation}
        title="Unsere Geschichte"
        subtitle="Von den Wienerberger Ziegelwerken zur Pfarre Emmaus am Wienerberg."
      />
      <Responsive>
        <section className="pt-24 lg:pt-32">
          <SectionIntro title="Vom Ziegelwerk zur Siedlung" />
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Paragraphs paragraphs={SETTLEMENT.slice(0, 2)} />
            <Figure {...SETTLEMENT_IMAGES.brickworks} />
          </div>
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
            <Figure {...SETTLEMENT_IMAGES.recreation} />
            <Paragraphs paragraphs={SETTLEMENT.slice(2)} />
          </div>
        </section>
        <section className="grid items-center gap-10 pt-24 lg:grid-cols-2 lg:pt-32">
          <div>
            <SectionIntro title="Die Kirche" />
            <Paragraphs paragraphs={CHURCH} />
          </div>
          <div
            className="aspect-[16/20] w-full rounded-xl bg-cover bg-center shadow-xl"
            style={{ backgroundImage: `url(${PHOTOS.church})` }}
          />
        </section>
        <section className="pt-24 lg:pt-32">
          <SectionIntro title="Chronik" />
          <Timeline events={EVENTS} />
        </section>
      </Responsive>
      <Banner1
        text="Brannte uns nicht das Herz in der Brust?"
        image={PHOTOS.altar}
      />
      <Responsive>
        <section className="pt-24 pb-24 lg:pt-32 lg:pb-32">
          <SectionIntro title="Ursprung des Namens">
            In der Heiligen Schrift begegnen wir Emmaus in einer Episode, die
            nach der Auferstehung Jesu Christi stattfindet.
          </SectionIntro>
          <blockquote className="border-emmaus/40 mt-10 flex max-w-2xl flex-col gap-5 border-l-2 pl-6 text-lg leading-relaxed text-neutral-700">
            {EMMAUS_PASSAGE.map((paragraph) => (
              <p key={paragraph.slice(0, 20)}>{paragraph}</p>
            ))}
            <footer className="text-base font-semibold text-neutral-900">
              Lk 24,13-35
            </footer>
          </blockquote>
          <div className="mt-24 text-sm text-neutral-500">
            Quellen:{" "}
            {SOURCES.map((source, i) => (
              <span key={source.url}>
                {i > 0 && ", "}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:no-underline"
                >
                  {source.name}
                </a>
              </span>
            ))}
          </div>
        </section>
      </Responsive>
    </Site>
  );
}
