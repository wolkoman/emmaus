import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/domain/events/EventMapper";
import Link from "next/link";
import { PiArrowRightBold } from "react-icons/pi";

export const ACUTIS_DATE = "2026-11-21";

/** The calendar entries the special card replaces on that day. */
export function isAcutisEvent(event: CalendarEvent) {
  return (
    event.date === ACUTIS_DATE &&
    `${event.summary} ${event.description ?? ""}`.includes("Acutis")
  );
}

const PROGRAMME = [
  {
    time: "16:00",
    title: "Hl. Messe",
    note: "Deutsch, Kroatisch, Italienisch, Englisch. Auch im Livestream.",
  },
  {
    time: "17:00",
    title: "Begegnung mit der Mutter des Heiligen Carlo Acutis",
  },
  {
    time: "19:00",
    title: "Premiere des Films über Carlo, mit Ansprache seiner Mutter Antonia",
    note: "Kino Hollywood Megaplex Gasometer, Guglgasse 11, 1110 Wien",
  },
];

export function AcutisEvent(props: { spaced: boolean }) {
  return (
    <div
      className={`${props.spaced ? "mb-2 lg:mb-4" : ""} flex flex-col rounded-lg bg-white px-4 py-3 text-balance ring-1 ring-black/10 ring-inset`}
    >
      <div className="mb-2 text-base leading-5 font-semibold">
        Jesus erkennen mit dem Heiligen Carlo Acutis
      </div>
      <div className="text-black/80">
        <p>
          Carlo Acutis wuchs in Mailand auf und starb 2006 mit 15 Jahren. Er
          lebte seinen Glauben an Jesus in der Eucharistie mit großer
          Begeisterung und gab ihn auch über das Internet weiter. 2025 wurde er
          heiliggesprochen.
        </p>
        <p className="mt-2">
          Nun besucht uns seine Mutter, Antonia Salzano Acutis. Wir feiern mit
          ihr die Hl. Messe, und Sie haben die Gelegenheit, ihr persönlich zu
          begegnen. Am Abend feiert der Dokumentarfilm über sein Leben im Kino
          Premiere; zu Beginn spricht sie.
        </p>
        <div className="mt-2 grid grid-cols-[max-content_auto] gap-x-3 gap-y-1">
          {PROGRAMME.map((item) => (
            <div key={item.time} className="contents">
              <div className="font-semibold">{item.time}</div>
              <div>
                {item.title}
                {item.note && <div className="text-sm">{item.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Link href="/carlo">
          <Button size="sm">
            Livestream, Kinokarten und alle Infos <PiArrowRightBold />
          </Button>
        </Link>
      </div>
    </div>
  );
}
