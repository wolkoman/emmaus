import { CalendarEvent } from "@/domain/events/EventMapper";
import { CpLiturgy } from "@/util/cockpit.generated";

export function resolveAvailableLiturgies(
  liturgy: CpLiturgy,
  event: CalendarEvent,
) {
  const afterSunset = +event.start.dateTime.substring(11, 13) >= 16;
  const today = new Date(new Date(event.date).getTime())
    .toISOString()
    .substring(0, 10);
  const tomorrow = new Date(new Date(event.date).getTime() + 1000 * 3600 * 24)
    .toISOString()
    .substring(0, 10);
  const liturgyToday = liturgy[today] ?? [];
  if (afterSunset) {
    const liturgyTomorrow = liturgy[tomorrow] ?? [];
    return [...liturgyToday, ...liturgyTomorrow];
  } else {
    return liturgyToday;
  }
}
