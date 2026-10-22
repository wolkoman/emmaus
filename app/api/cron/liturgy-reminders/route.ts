import { CalendarTag } from "@/domain/events/EventMapper";
import { loadEvents } from "@/domain/events/EventsLoader";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";
import { sendLiturgyMail } from "@/domain/liturgy/liturgy-mail";
import {
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
} from "@/util/cockpit.generated";
import { NextResponse } from "next/server";

const REMINDED_POSITIONS = [
  CpLiturgyRosterPosition.READER1,
  CpLiturgyRosterPosition.READER2,
];

// Triggered daily by .github/workflows/liturgy-reminders-cron.yml.
export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
  }).format(Date.now() + 24 * 3600 * 1000);

  const repo = liturgyRepo();
  const [liturgyEvents, rosters, liturgies, persons] = await Promise.all([
    repo
      .fetchLiturgyEvents()
      .then((es) => es.filter((e) => e.date === tomorrow)),
    repo.fetchLiturgyRosters(),
    repo.fetchLiturgy(),
    repo.fetchPersons(),
  ]);
  const liturgyEventIds = liturgyEvents.map((e) => e._id);

  const events = await loadEvents({
    access: EventLoadAccess.READER,
    ids: liturgyEvents.map((e) => e.eventId).filter((id): id is string => !!id),
  }).then((x) => x.events);
  const activeEventIds = events
    .filter((e) => !e.tags.includes(CalendarTag.cancelled))
    .map((e) => e.id);

  const due = rosters.filter((r) => {
    const liturgyEvent = liturgyEvents.find((e) => e._id === r.liturgyEventId);
    return (
      liturgyEventIds.includes(r.liturgyEventId) &&
      activeEventIds.includes(liturgyEvent?.eventId ?? "") &&
      r.status === CpLiturgyRosterStatus.Informed &&
      REMINDED_POSITIONS.includes(r.position) &&
      !r.reminderSent
    );
  });

  const recipients = persons.filter(
    (p) =>
      p.email.includes("@") &&
      !p.liturgyRemindersDisabled &&
      due.some((r) => r.userId === p._id),
  );
  const results = await Promise.allSettled(
    recipients.map(async (person) => {
      const personRosters = due.filter((r) => r.userId === person._id);
      await sendLiturgyMail({
        person,
        rosters: personRosters,
        liturgyEvents,
        events,
        liturgies,
        reminder: true,
      });
      // Marked only after a successful send so a failed mail is retried on the next run.
      const sentAt = new Date().toISOString();
      await Promise.all(
        personRosters.map((r) =>
          repo.saveLiturgyRoster({ _id: r._id, reminderSent: sentAt }),
        ),
      );
      return person.name;
    }),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(
      `Failed to send ${failed.length} liturgy reminder(s):`,
      failed.map((r) => r.reason),
    );
  }

  return NextResponse.json(
    {
      date: tomorrow,
      due: due.length,
      sent: results.length - failed.length,
      failed: failed.length,
      skipped: due.filter((r) => !recipients.some((p) => p._id === r.userId))
        .length,
    },
    { status: failed.length > 0 ? 500 : 200 },
  );
}
