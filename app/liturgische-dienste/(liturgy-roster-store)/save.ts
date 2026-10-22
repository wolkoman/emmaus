"use server";

import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { isLiturgyPlaner } from "@/app/liturgische-dienste/(liturgy-roster-store)/permission-util";
import { servantAllowance } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";
import {
  CpLiturgyRoster,
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
} from "@/util/cockpit.generated";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";

export async function upsertLiturgyPosition(
  liturgyEventId: string,
  position: CpLiturgyRosterPosition,
  personId: string | null,
): Promise<CpLiturgyRoster | null> {
  const planer = await resolveUserFromServer();

  if (!isLiturgyPlaner(planer)) throw Error("Unauthorized");

  const allowedPositions = servantAllowance
    .filter((allowance) => planer?.competences.includes(allowance.planer))
    .flatMap((allowance) => allowance.allowed);

  if (!allowedPositions.includes(position))
    throw Error("Disallowed key " + position);

  const repo = liturgyRepo();
  const roster = await repo.fetchOneLiturgyRoster({
    liturgyEventId: liturgyEventId,
    position,
  });
  if (personId === null) {
    await repo.deleteLiturgyRoster(roster!._id);
    return null;
  }
  const person = await repo.fetchOnePerson({ _id: personId });
  if (!person) throw Error("Unknown person " + personId);

  const updatedRoster = await repo.saveLiturgyRoster({
    _id: roster?._id,
    position,
    liturgyEventId: liturgyEventId,
    status: CpLiturgyRosterStatus.Assigned,
    userId: personId,
    userName: person.name,
    reminderSent: "",
  });
  if (!updatedRoster) throw new Error("Unauthorized");
  return updatedRoster;
}

export async function upsertLiturgy(
  calendarEventId: string,
  date: string,
  liturgyName: string,
) {
  const user = await resolveUserFromServer();

  if (!isLiturgyPlaner(user)) throw Error("Unauthorized");

  const repo = liturgyRepo();
  const liturgyEvent = await repo.fetchOneLiturgyEvent({
    eventId: calendarEventId,
  });
  return await repo.saveLiturgyEvent({
    _id: liturgyEvent?._id,
    eventId: calendarEventId,
    liturgyName: liturgyName,
    date: date,
  });
}
