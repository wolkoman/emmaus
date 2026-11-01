import { formatDay, formatTime, LIVE_TEXT } from "@/app/carlo/i18n";
import {
  FILM_START,
  LIVESTREAM,
  MEETING_START,
  TICKET_URL,
} from "@/app/carlo/livestream";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PiArrowRightBold, PiArrowSquareOutBold } from "react-icons/pi";

/** Homepage banner right below the hero that points visitors to /carlo. */
export function CarloTeaser() {
  const text = LIVE_TEXT.de;
  const [beforeMother, afterMother] = text.lead.split(text.mother);
  const programme = [
    { time: LIVESTREAM.start, title: "Hl. Messe, auch im Livestream" },
    { time: MEETING_START, title: text.programme.meeting },
    { time: FILM_START, title: "Filmpremiere im Kino Gasometer" },
  ];

  return (
    <section
      aria-labelledby="carlo-teaser-heading"
      className="mt-6 grid overflow-hidden rounded-xl bg-[#2b6265] text-white shadow-xl md:grid-cols-[16rem_1fr] lg:grid-cols-[20rem_1fr]"
    >
      <Link
        href="/carlo"
        tabIndex={-1}
        aria-hidden
        className="relative h-56 sm:h-72 md:h-auto"
      >
        <Image
          src="/carlo/carlo-acutis.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 20rem, (min-width: 768px) 16rem, 100vw"
          className="object-cover object-[50%_15%]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent from-50% to-[#2b6265] md:bg-linear-to-r md:from-60%" />
      </Link>

      <div className="flex flex-col gap-5 p-6 lg:p-10">
        <div className="text-sm font-semibold tracking-wider text-[#aadcd8] uppercase">
          {formatDay(LIVESTREAM.start, "de")} · Pfarre Emmaus
        </div>
        <h2
          id="carlo-teaser-heading"
          className="-mt-2 text-3xl leading-tight font-bold tracking-tight text-balance italic lg:text-5xl"
        >
          <Link href="/carlo" className="hover:underline">
            {text.motto}
          </Link>
        </h2>
        <p className="text-lg leading-snug lg:text-xl">
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
        <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 lg:text-lg">
          {programme.map((item) => (
            <div key={item.time} className="contents">
              <div className="font-semibold text-[#aadcd8]">
                {formatTime(item.time, "de")}
              </div>
              <div>{item.title}</div>
            </div>
          ))}
        </div>
        <div>
          <Link href="/carlo">
            <Button
              size="lg"
              className="bg-white px-4 text-base font-semibold text-[#2b6265] hover:bg-white/85"
            >
              Alle Infos und Livestream <PiArrowRightBold />
            </Button>
          </Link>
        </div>
        {TICKET_URL && (
          <div className="rounded-lg bg-white/10 p-4 lg:p-5">
            <div className="font-semibold lg:text-lg">
              Kinokarten für die Filmpremiere um {formatTime(FILM_START, "de")}
            </div>
            <p className="mt-1 text-white/80">{text.tickets.howTo}</p>
            <a
              href={TICKET_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block"
            >
              <Button
                size="lg"
                className="border-white/60 bg-transparent px-4 text-base font-semibold text-white hover:bg-white/10"
              >
                {text.tickets.link} <PiArrowSquareOutBold />
              </Button>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
