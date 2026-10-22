import { Suspense } from "react";

import { Links } from "@/app/(shared)/Links";
import { formatDate, formatTime } from "@/app/(shared)/Localization";
import { flyerAnnouncementTiles } from "@/app/monatsblatt/content";
import type { MonthlyData } from "@/app/monatsblatt/editor/store";
import { fetchPublishedMonthly } from "@/app/monatsblatt/fetchMonthly.server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarGroup } from "@/domain/events/CalendarGroup";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { loadCachedEvents } from "@/domain/events/EventsLoader";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import Link from "next/link";
import { PiArrowRightBold } from "react-icons/pi";
import { RiExternalLinkLine } from "react-icons/ri";
import { ErrBoundary } from "./(shared)/ErrBoundary";
import { LIVESTREAM } from "./carlo/livestream";
import { UntilLivestreamEnds } from "./UntilLivestreamEnds";

async function FeaturedEvents() {
  "use cache";
  // "hours" instead of "minutes": the underlying loadCachedEvents is cached
  // for an hour anyway, and per-minute revalidation was burning through
  // Vercel ISR write units (~1.4k writes/day for this entry alone).
  cacheLife("hours");
  const events = await loadCachedEvents({
    access: EventLoadAccess.PUBLIC,
  }).then((x) =>
    x.events
      .filter((event) => event.groups.includes(CalendarGroup.Messe))
      .slice(0, 3),
  );
  return (
    <>
      {events.map((event) => (
        <div key={event.id} className="contents">
          <div>
            {formatDate(event.date, {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            })}
          </div>
          <div>{formatTime(event.start.dateTime)}</div>
          <div>{event.summary}</div>
        </div>
      ))}
    </>
  );
}

/** Article headlines of the Monatsblatt currently lying in the church. */
async function FeaturedMonthly() {
  "use cache";
  cacheLife("hours");
  const issue = await fetchPublishedMonthly();
  const titles = issue
    ? flyerAnnouncementTiles((issue.data as MonthlyData).tiles).map(
        (tile) => tile.title,
      )
    : [];
  if (titles.length === 0) {
    return (
      <div className="opacity-70">Das nächste Monatsblatt folgt bald.</div>
    );
  }
  return (
    <>
      {titles.map((title) => (
        <div key={title} className="flex">
          <div className="mt-3 mr-2 h-0.5 w-2 shrink-0 rounded-full bg-black"></div>
          {title}
        </div>
      ))}
    </>
  );
}

function NextLivestreams() {
  const start = new Date(LIVESTREAM.start);
  const inVienna = { timeZone: "Europe/Vienna" } as const;
  return (
    <Card
      variant="emmaus"
      className="py-6 text-base *:data-slot:px-6 lg:text-lg"
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Nächste Livestreams
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[max-content_max-content_auto] gap-x-4 gap-y-1">
          <div>
            {start.toLocaleDateString("de-AT", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              ...inVienna,
            })}
          </div>
          <div>
            {start.toLocaleTimeString("de-AT", {
              hour: "2-digit",
              minute: "2-digit",
              ...inVienna,
            })}
          </div>
          <div>Hl. Messe zu Ehren des Heiligen Carlo Acutis</div>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Link href="/carlo">
          <Button>
            Zum Livestream <PiArrowRightBold />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

async function Skeleton() {
  return (
    <>
      <div className="bg-emmaus/20 h-8 animate-pulse rounded-lg" />
      <div className="bg-emmaus/20 h-8 animate-pulse rounded-lg" />
      <div className="bg-emmaus/20 h-8 animate-pulse rounded-lg" />
    </>
  );
}

export async function WelcomeAndFeatured() {
  const highlight = "italic font-semibold";

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
      <div className="flex max-w-md flex-col gap-4 pt-16 text-lg leading-normal text-pretty lg:pt-24 lg:text-xl">
        <div>
          Unsere Pfarre ist ein Ort der{" "}
          <span className={highlight}>Gemeinschaft</span>, des{" "}
          <span className={highlight}>Glaubens</span> und der{" "}
          <span className={highlight}>Begegnung</span>. Inspiriert von den
          Emmaus-Jüngern laden wir Sie ein, Jesu Gegenwart zu erleben.
        </div>
        <div>
          Die{" "}
          <Link
            href="/heilige-messe"
            className="inline-block font-semibold underline hover:no-underline"
          >
            Heilige Messe ist unser Herzstück{" "}
            <RiExternalLinkLine className="-mt-2 inline-block w-3" />
          </Link>
          , begleitet von einem lebendigen Gemeindeleben &ndash; von
          Kinderaktivitäten bis zu Glaubensabenden. Ob Stammgast oder spontan
          vorbeigeschaut: Sie sind immer willkommen!
        </div>
      </div>

      <div className="grid gap-6">
        <Card
          variant="emmaus"
          className="py-6 text-base *:data-slot:px-6 lg:text-lg"
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Nächste Heilige Messen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrBoundary>
              <Suspense fallback={<Skeleton />}>
                <div className="grid grid-cols-[max-content_max-content_auto] gap-x-4 gap-y-1">
                  <FeaturedEvents />
                </div>
              </Suspense>
            </ErrBoundary>
          </CardContent>
          <CardFooter className="justify-end">
            <Link href={Links.Termine}>
              <Button>
                Alle anzeigen <PiArrowRightBold />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <UntilLivestreamEnds
          during={<NextLivestreams />}
          after={
            <Card
              variant="emmaus"
              className="py-6 text-base *:data-slot:px-6 lg:text-lg"
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Aktuelle Mitteilungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-y-1">
                  <Suspense fallback={<Skeleton />}>
                    <FeaturedMonthly />
                  </Suspense>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Link href={Links.Monatsblatt}>
                  <Button>
                    Alle anzeigen <PiArrowRightBold />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          }
        />
      </div>
    </div>
  );
}
