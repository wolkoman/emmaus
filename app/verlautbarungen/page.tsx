import { formatDate } from "@/app/(shared)/Localization";
import { loadCachedEvents } from "@/domain/events/EventsLoader";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { groupEventsByDate } from "@/domain/events/CalendarGrouper";
import { loadCachedLiturgyData } from "@/domain/liturgy/liturgy-loading";
import { ArticleView } from "@/app/monatsblatt/FlyerTiles";
import { afterMassAnnouncementTiles } from "@/app/monatsblatt/content";
import type { MonthlyData } from "@/app/monatsblatt/editor/store";
import { fetchPublishedMonthly } from "@/app/monatsblatt/fetchMonthly.server";
import { renderEventsGroupedByDate } from "@/components/calendar/RenderEventsGroupedByDate";
import { Loading } from "@/components/Loading";
import { SectionHeader } from "@/components/SectionHeader";
import { InternPage } from "@/components/intern/InternLayout";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Verlautbarungen | Emmaus",
  description: "Termine und Ankündigungen zum Vorlesen nach der Messe",
};

const VIENNA_TIME_ZONE = "Europe/Vienna";

function viennaDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("de-AT", {
    timeZone: VIENNA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function VerlautbarungenContent() {
  const [eventsObject, liturgies, issue] = await Promise.all([
    loadCachedEvents({ access: EventLoadAccess.PUBLIC }),
    loadCachedLiturgyData(),
    fetchPublishedMonthly(),
  ]);
  await connection();
  const today = viennaDateString();
  const start = addDays(today, 1);
  const end = addDays(today, 7);
  const events = eventsObject.events
    .filter((event) => start <= event.date && event.date <= end)
    .map((event) => ({ ...event, roster: [] }));
  const groupedEvents = Object.entries(groupEventsByDate(events));
  const monthly = issue?.data as MonthlyData | undefined;
  const announcements = monthly?.tiles
    ? afterMassAnnouncementTiles(monthly.tiles)
    : [];

  return (
    <>
      {groupedEvents.length > 0 ? (
        groupedEvents.map(renderEventsGroupedByDate(true, liturgies))
      ) : (
        <div>Für diesen Zeitraum sind keine Termine eingetragen.</div>
      )}

      {!issue ? (
        <div>Derzeit ist kein Monatsblatt veröffentlicht.</div>
      ) : announcements.length === 0 ? (
        <div>Im aktuellen Monatsblatt gibt es keine Ankündigungen.</div>
      ) : (
        <div className="my-12 gap-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="mb-8 break-inside-avoid">
              <ArticleView
                title={announcement.title}
                text={announcement.text}
                icon={announcement.icon}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function VerlautbarungenPage() {
  return (
    <InternPage title="Verlautbarungen">
      <Suspense
        fallback={
          <div className="grid place-items-center">
            <Loading />
          </div>
        }
      >
        <VerlautbarungenContent />
      </Suspense>
    </InternPage>
  );
}
