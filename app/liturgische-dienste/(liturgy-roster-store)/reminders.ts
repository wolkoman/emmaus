"use server";

import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { isLiturgyUser } from "@/app/liturgische-dienste/(liturgy-roster-store)/permission-util";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";

// Read from the DB: the person in the JWT is a snapshot from login.
export async function getLiturgyRemindersEnabled(): Promise<boolean> {
  const user = await resolveUserFromServer();
  if (!user || !isLiturgyUser(user)) throw Error("Unauthenticated");
  const person = await liturgyRepo().fetchOnePerson({ _id: user._id });
  return !person?.liturgyRemindersDisabled;
}

export async function setLiturgyRemindersEnabled(enabled: boolean) {
  const user = await resolveUserFromServer();
  if (!user || !isLiturgyUser(user)) throw Error("Unauthenticated");
  await liturgyRepo().savePersonLiturgyRemindersDisabled(user._id, !enabled);
}
