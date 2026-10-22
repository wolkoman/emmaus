import { CalendarGroup } from "@/domain/events/CalendarGroup";

export type FilterType = { filterType: "GROUP"; group: CalendarGroup } | null;

export function getWeekDayName(day: number) {
  return [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ][day];
}
