import { getWeekDayName } from "@/components/calendar/Calendar";
import { CalendarEvent, CalendarTag } from "@/domain/events/EventMapper";
import { Links } from "@/app/(shared)/Links";
import {
  CpLiturgy,
  CpLiturgyEvent,
  CpLiturgyRoster,
  CpLiturgyRosterPosition,
  CpPerson,
} from "@/util/cockpit.generated";
import { roleToString } from "@/domain/service/Service";
import { signToken } from "@/domain/jsonwebtoken";
import { render } from "@react-email/components";
import LiturgyNotification from "@/emails/liturgy-notification";
import LiturgyReminder from "@/emails/liturgy-reminder";
import { mailOptions, transporter } from "@/app/(shared)/mail/sendMail";
import { readingToBibleServerUrl } from "@/util/bibleServer";

export async function sendLiturgyMail({
  person,
  rosters,
  liturgyEvents,
  events,
  liturgies,
  reminder = false,
}: {
  person: CpPerson;
  rosters: CpLiturgyRoster[];
  liturgyEvents: CpLiturgyEvent[];
  events: CalendarEvent[];
  liturgies: CpLiturgy;
  reminder?: boolean;
}) {
  function findEventForRoster(roster: CpLiturgyRoster) {
    const liturgyEvent = liturgyEvents.find(
      (l) => l._id === roster.liturgyEventId,
    );
    if (!liturgyEvent) return null;
    const event = events.find((e) => e.id === liturgyEvent.eventId)!;
    return {
      event: event,
      liturgy: liturgies[event.date].find(
        (l) => l.name === liturgyEvent.liturgyName,
      ),
    };
  }

  const eventsList = rosters
    .map((roster) => ({
      roster,
      ...findEventForRoster(roster),
    }))
    .map(({ roster, event, liturgy }) => ({
      roster,
      event,
      date: new Date(event?.start.dateTime ?? ""),
      reading:
        roster.position === CpLiturgyRosterPosition.READER1
          ? liturgy?.reading1
          : roster.position === CpLiturgyRosterPosition.READER2
            ? liturgy?.reading2
            : "",
    }));
  const mailEvents = eventsList.map(({ roster, event, date, reading }) => ({
    date: `${getWeekDayName(date.getDay())}, ${date.toLocaleDateString("de-AT")}, ${date.toLocaleTimeString("de-AT", { timeZone: "Europe/Vienna" }).substring(0, 5)}`,
    summary: event?.summary ?? "Unbekannt",
    description: event?.tags.includes(CalendarTag.private)
      ? ""
      : (event?.description ?? ""),
    info: `${roleToString(roster.position)}: ${reading}`,
    link: readingToBibleServerUrl(reading ?? ""),
  }));
  // Never put the stored login code into a token: JWT payloads are readable.
  const jwt = await signToken({ ...person, code: "user" }, "90d");
  const loginLink = (redirect: string) =>
    `https://emmaus.wien${Links.Login}?redirect=${encodeURIComponent(redirect)}&jwt=${jwt}`;
  // Reminders deliberately omit the sign-off button: a day ahead is too late to find a replacement.
  const emailHtml = await render(
    reminder
      ? LiturgyReminder({
          name: person.name,
          settingsLink: loginLink(`${Links.DiensteUebersicht}?ansicht=meine`),
          events: mailEvents,
        })
      : LiturgyNotification({
          name: person.name,
          link: loginLink(Links.DiensteUebersicht),
          events: mailEvents,
        }),
  );

  // Extract dates for subject line (format: dd.MM.yyyy)
  const subjectDates = eventsList
    .map(({ date }) => date.toLocaleDateString("de-AT"))
    .join(", ");

  await transporter.sendMail({
    ...mailOptions,
    to: `${person.name} <${person.email}>`,
    subject: reminder
      ? `Erinnerung: Liturgischer Dienst morgen (${subjectDates})`
      : `Liturgische Dienste: ${subjectDates}`,
    html: emailHtml,
  });
}
