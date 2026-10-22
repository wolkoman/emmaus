import { Event } from "@/components/calendar/Event";
import { ReactNode } from "react";
import { EventDate } from "@/components/calendar/EventUtils";
import { CalendarGroup } from "@/domain/events/CalendarGroup";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import {
  compareLiturgy,
  isDisplayedLiturgy,
  liturgyDayName,
} from "@/domain/liturgy/liturgy-order";

export function renderEventsGroupedByDate(
  noColumn?: true,
  liturgies?: Liturgy[],
  renderBefore?: (date: string, events: CalendarEvent[]) => ReactNode,
) {
  return ([date, events]: [string, CalendarEvent[]], index: number) => {
    const l = liturgies
      ?.filter((l) => l.date === date)
      .sort(compareLiturgy)?.[0];
    const showLiturgy = isDisplayedLiturgy(l, date);
    return (
      <div
        key={date + index}
        data-date={date}
        className="grid grid-cols-[90px_auto] py-2 lg:grid-cols-[150px_auto] lg:gap-6 lg:py-4"
      >
        <div className="my-1">
          <EventDate date={date} />
        </div>
        <div>
          {l?.name && showLiturgy && (
            <div className="mb-1 rounded border border-black/10 px-3 py-2 text-sm leading-tight font-semibold uppercase lg:hidden">
              {l.name}
              {l.rank == "H" ? ", Hochfest" : ""}
            </div>
          )}
          {renderBefore?.(date, events)}
          <div
            className={`grid ${noColumn ? "" : "md:grid-cols-2 lg:grid-cols-3"} gap-2 lg:gap-4`}
          >
            {events.map((event) => {
              const liturgyName =
                event.liturgyName ??
                (showLiturgy && event.groups.includes(CalendarGroup.Messe)
                  ? liturgyDayName(l)
                  : undefined);
              return (
                <Event
                  key={event.id}
                  event={{ ...event, liturgyName }}
                  liturgy={l}
                  // The mobile banner above already names this liturgy.
                  liturgyNameDesktopOnly={
                    showLiturgy &&
                    (liturgyName === l?.name ||
                      liturgyName === liturgyDayName(l))
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };
}
