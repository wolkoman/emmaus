import { Links } from "@/app/(shared)/Links";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarGroup,
  calendarGroupEmojis,
} from "@/domain/events/CalendarGroup";
import { groupEventsByGroupAndDate } from "@/domain/events/CalendarGrouper";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { loadCachedEvents } from "@/domain/events/EventsLoader";
import Link from "next/link";

export async function ComingUp() {
  const eventsObject = await loadCachedEvents({
    access: EventLoadAccess.PUBLIC,
  });
  const groups = groupEventsByGroupAndDate(eventsObject.events);

  const hiddenGroups = [CalendarGroup.Sakramente];
  return (
    <div className="my-44">
      <div className="my-8 items-end justify-between lg:flex">
        <div className="text-3xl">
          Wir haben für jeden eine passende Veranstaltung.
          <br />
          <span className="font-bold">Komm doch einmal vorbei!</span>
        </div>
        <Link href={Links.Termine}>
          <Button variant="link">Alle Termine anzeigen</Button>
        </Link>
      </div>
      <div className="flex grid-cols-2 flex-col gap-4 lg:grid">
        {groups
          .filter(([group]) => !hiddenGroups.includes(group))
          .map(([group, events]) => (
            <Card
              variant="emmaus"
              className="py-6 *:data-slot:px-6 lg:py-8 lg:*:data-slot:px-8"
              key={group}
            >
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{group}</CardTitle>
                <CardAction>
                  <div className="text-5xl">{calendarGroupEmojis[group]}</div>
                </CardAction>
              </CardHeader>
              <CardContent className="text-base">
                {Object.entries(events).map(([date, events]) => (
                  <div
                    key={date}
                    className="grid grid-cols-[140px_auto] [&:last-child_.border-b]:border-none"
                  >
                    <div className="border-emmaus/20 border-b py-2 pl-0">
                      {new Date(date + "T02:00").toLocaleDateString("de-AT", {
                        weekday: "long",
                        day: "numeric",
                        month: "2-digit",
                      })}
                    </div>
                    <div className="flex flex-col">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className="border-emmaus/20 border-b px-6 py-2"
                        >
                          {event.time} {event.summary}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
