import ical, {
  ICalCalendar,
  ICalEventData,
  ICalEventStatus,
} from "ical-generator";
import { loadEvents } from "../(domain)/events/EventsLoader";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { CalendarEvent } from "../(domain)/events/EventMapper";

export async function GET() {
  // MIGRATED: Removed "use cache" directive - route handlers that return non-JSON responses
  // (like iCal files) should not use caching as the response objects cannot be serialized.
  // Instead, we use Cache-Control headers to enable HTTP caching.
  try {
    // Load events with public access (redacted)
    const eventsObject = await loadEvents({
      access: EventLoadAccess.PUBLIC,
    });

    // Create calendar
    const calendar: ICalCalendar = ical({
      name: "Pfarre Emmaus - Termine",
      description: "Öffentlicher Terminkalender der Pfarre Emmaus",
      timezone: "Europe/Vienna",
      ttl: 3600, // Cache for 1 hour
      url: "https://emmaus.wien/termine.ical",
    });

    // Add events to calendar
    eventsObject.events.forEach((event: CalendarEvent) => {
      try {
        // Determine start and end dates
        const startDate = event.start?.dateTime
          ? new Date(event.start.dateTime)
          : new Date(event.date);
        const endDate = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : new Date(event.date);

        const eventData: ICalEventData = {
          id: event.id,
          summary: event.summary,
          start: startDate,
          end: endDate,
        };

        // Mark as all-day event if applicable
        if (event.wholeday) {
          eventData.allDay = true;
        }

        // Add description if available
        if (event.description) {
          eventData.description = event.description;
        }

        // Add roster information to description if available
        if (event.roster && event.roster.length > 0) {
          const rosterText = event.roster
            .map((r) => `${r.position}: ${r.userName}`)
            .join("\n");
          eventData.description = event.description
            ? `${event.description}\n\n${rosterText}`
            : rosterText;
        }

        // Add categories based on groups
        if (event.groups && event.groups.length > 0) {
          eventData.categories = event.groups
            .filter((g) => g)
            .map((g) => ({ name: g }));
        }

        // Mark as cancelled if applicable
        if (event.tags && event.tags.includes("cancelled" as any)) {
          eventData.status = ICalEventStatus.CANCELLED;
        }

        calendar.createEvent(eventData);
      } catch (eventError) {
        console.error(`Error processing event ${event.id}:`, eventError);
        // Skip this event and continue with the next one
      }
    });

    // Generate iCal string
    const calendarString = calendar.toString();

    return new Response(calendarString, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="termine.ics"',
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating iCal feed:", error);
    return new Response("Error generating calendar feed", { status: 500 });
  }
}
