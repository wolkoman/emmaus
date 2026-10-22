import { getGoogleAuthClient } from "../../(shared)/GoogleAuthClient";
import { google } from "googleapis";

import { CALENDAR_INFO } from "./CalendarInfo";
import { CalendarEvent, mapEvent } from "./EventMapper";
import {
  EventLoadAccess,
  EventLoadOptions,
} from "@/domain/events/EventLoadOptions";
import {
  CpLiturgyEvent,
  CpLiturgyRoster,
  CpLiturgyRosterStatus,
} from "@/util/cockpit.generated";

export async function loadCalendar(
  options: EventLoadOptions,
  roster: (CpLiturgyRoster & { calEventId?: string })[],
  oauth2Client: any,
  liturgyEvents: CpLiturgyEvent[] = [],
): Promise<CalendarEvent[]> {
  if (!oauth2Client) oauth2Client = await getGoogleAuthClient();
  const todayDate = new Date();
  todayDate.setHours(0);
  const start = todayDate.getTime();
  const end =
    start +
    3600000 *
      24 *
      30 *
      {
        [EventLoadAccess.WEEKLY]: 1,
        [EventLoadAccess.PUBLIC]: 2,
        [EventLoadAccess.READER]: 6,
        [EventLoadAccess.PRIVATE_ACCESS]: 6,
      }[options.access];
  const hasTimeframe =
    (options.access === EventLoadAccess.PRIVATE_ACCESS ||
      options.access === EventLoadAccess.WEEKLY) &&
    options.timeFrame;

  return google
    .calendar("v3")
    .events.list({
      maxResults: 1000,
      calendarId: CALENDAR_INFO.calendarId,
      auth: oauth2Client,
      timeMin: (hasTimeframe
        ? options.timeFrame!.min
        : new Date(start)
      ).toISOString(),
      timeMax: (hasTimeframe
        ? options.timeFrame!.max
        : new Date(end)
      ).toISOString(),
      singleEvents: true,
      timeZone: "Europa/Vienna",
      orderBy: "startTime",
    })
    .then((result) =>
      result.data
        .items!.map(mapEvent(options))
        .filter((event): event is CalendarEvent => !!event?.summary)
        .filter(
          (event) =>
            options.access !== EventLoadAccess.READER ||
            options.ids.includes(event.id),
        )
        .map((event) => ({
          ...event,
          liturgyName: liturgyEvents.find((l) => l.eventId === event.id)
            ?.liturgyName,
          roster: roster
            .filter(
              (r) =>
                r.calEventId === event.id &&
                (options.access !== EventLoadAccess.PUBLIC ||
                  r.status == CpLiturgyRosterStatus.Informed),
            )
            .map((r) =>
              options.access === EventLoadAccess.PUBLIC &&
              !r.userName.includes("Tamburica") &&
              !r.userName.includes("band")
                ? {
                    ...r,
                    userName: r.userName.split(" ")[0] ?? r.userName,
                  }
                : r,
            ),
        })),
    );
}
