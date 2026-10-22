"use server";

import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { isLiturgyUser } from "@/app/liturgische-dienste/(liturgy-roster-store)/permission-util";
import { getAllowedRoles } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";
import {
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
} from "@/util/cockpit.generated";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";

export default async function transfer(
  liturgyEventId: string,
  position: CpLiturgyRosterPosition,
) {
  const user = await resolveUserFromServer();
  const allowedRoles = getAllowedRoles(user, "self");

  if (!user || !isLiturgyUser(user)) throw Error("Unauthorized");
  if (!allowedRoles.includes(position)) throw Error("Unauthorized");

  const repo = liturgyRepo();
  const [roster, person] = await Promise.all([
    repo.fetchOneLiturgyRoster({
      liturgyEventId: liturgyEventId,
      position: position,
    }),
    repo.fetchOnePerson({ _id: user._id }),
  ]);
  if (!roster || roster.status !== CpLiturgyRosterStatus.Cancelled) {
    throw Error("Bad request");
  }
  if (!person) throw Error("Unknown person " + user._id);

  return await repo.saveLiturgyRoster({
    ...roster,
    status: CpLiturgyRosterStatus.Informed,
    userId: person._id,
    userName: person.name,
    reminderSent: "",
  });
}
