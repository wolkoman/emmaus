import { formatDay, formatTime, LIVE_TEXT } from "@/app/carlo/i18n";
import { LIVESTREAM } from "@/app/carlo/livestream";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { PiArrowRightBold } from "react-icons/pi";

/**
 * Homepage banner right below the hero that points visitors to /carlo.
 * Kept short on purpose: programme, tickets and directions live on /carlo only.
 */
export function CarloTeaser() {
  const text = LIVE_TEXT.de;
  const [beforeMother, afterMother] = text.lead.split(text.mother);

  return (
    <section
      aria-labelledby="carlo-teaser-heading"
      // 62rem is the content width of <Responsive> below (max-w-5xl minus its px-4).
      className="mx-auto mt-6 grid w-full max-w-[62rem] overflow-hidden rounded-xl bg-[#2b6265] text-white shadow-lg md:grid-cols-[14rem_1fr]"
    >
      <Link
        href="/carlo"
        tabIndex={-1}
        aria-hidden
        className="relative h-40 md:h-auto"
      >
        <Image
          src="/carlo/carlo-acutis.jpg"
          alt=""
          fill
          sizes="(min-width: 768px) 14rem, 100vw"
          className="object-cover object-[50%_15%]"
        />
      </Link>

      <div className="flex flex-col items-start gap-2 p-5 lg:px-6">
        <div className="font-semibold text-[#aadcd8]">
          {formatDay(LIVESTREAM.start, "de")}, ab{" "}
          {formatTime(LIVESTREAM.start, "de")} Uhr
        </div>
        <h2
          id="carlo-teaser-heading"
          className="text-2xl leading-tight font-bold tracking-tight text-balance italic lg:text-3xl"
        >
          <Link href="/carlo" className="hover:underline">
            {text.motto}
          </Link>
        </h2>
        <p className="text-lg leading-snug">
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
        <Link href="/carlo" className="mt-1">
          <Button className="bg-white px-3 text-base font-semibold text-[#2b6265] hover:bg-white/85">
            Alle Infos <PiArrowRightBold />
          </Button>
        </Link>
      </div>
    </section>
  );
}
