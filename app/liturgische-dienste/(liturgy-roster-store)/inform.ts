"use server";

import { loadEvents } from "@/domain/events/EventsLoader";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { servantAllowance } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";
import { CpLiturgyRosterStatus } from "@/util/cockpit.generated";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";
import { sendLiturgyMail } from "@/domain/liturgy/liturgy-mail";

export default async function inform(rosterIds: string[], withMail: boolean) {
  const user = await resolveUserFromServer();

  const repo = liturgyRepo();
  const [roster, liturgies] = await Promise.all([
    repo
      .fetchLiturgyRosters()
      .then((r) => r.filter((r) => rosterIds.includes(r._id))),
    repo.fetchLiturgy(),
  ]);
  const liturgyEventIds = roster.map((r) => r.liturgyEventId);
  const liturgyEvents = await repo
    .fetchLiturgyEvents()
    .then((r) => r.filter((r) => liturgyEventIds.includes(r._id)));

  const allowedPositions = servantAllowance
    .filter((allowance) => user?.competences.includes(allowance.planer))
    .flatMap((allowance) => allowance.allowed);
  if (roster.filter((r) => !allowedPositions.includes(r.position)).length > 0) {
    throw new Error("Not sufficient permissions");
  }
  if (
    roster.filter((r) => r.status !== CpLiturgyRosterStatus.Assigned).length > 0
  ) {
    throw new Error("Incorrect status");
  }

  const events = await loadEvents({
    access: EventLoadAccess.READER,
    ids: liturgyEvents
      .map((event) => event.eventId)
      .filter((id): id is string => !!id),
  }).then((x) => x.events);
  console.log({ events, liturgyEventIds, liturgyEvents, rosterIds });

  const userIds = roster.map((r) => r.userId);
  const users = await repo
    .fetchPersons()
    .then((ps) => ps.filter((p) => userIds.includes(p._id)));

  // Update status to INFORMED first to prevent duplicate emails
  const updatedRosters = await Promise.all(
    rosterIds.map((rosterId) =>
      repo.saveLiturgyRoster({
        _id: rosterId,
        status: CpLiturgyRosterStatus.Informed,
      }),
    ),
  );

  if (withMail) {
    if (users.filter((u) => !u.email.includes("@")).length > 0)
      throw new Error("Some users dont have mail");

    // Track failed emails
    const emailResults = await Promise.allSettled(
      users.map(async (user) => {
        await sendLiturgyMail({
          person: user,
          rosters: roster.filter((r) => r.userId === user._id),
          liturgyEvents,
          events,
          liturgies,
        });

        return { success: true, user: user.name };
      }),
    );

    // Check for failed emails and log them
    const failedEmails = emailResults.filter(
      (result) => result.status === "rejected",
    );
    if (failedEmails.length > 0) {
      console.error(
        `Failed to send ${failedEmails.length} email(s):`,
        failedEmails.map((result) =>
          result.status === "rejected" ? result.reason : null,
        ),
      );
      // Note: We don't throw here because status is already updated
      // and we want to inform the user about partial success
    }

    const successCount = emailResults.filter(
      (result) => result.status === "fulfilled",
    ).length;
    console.log(
      `Successfully sent ${successCount}/${users.length} notification emails`,
    );
  }

  return updatedRosters;
}
