"use server";

import { notifyAdmin } from "@/app/(shared)/Telegram";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { isLiturgyUser } from "@/app/liturgische-dienste/(liturgy-roster-store)/permission-util";
import {
  CpLiturgyEvent,
  CpLiturgyRoster,
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
} from "@/util/cockpit.generated";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";

export async function cancelLiturgicalService(
  liturgyEventId: string,
  position: CpLiturgyRosterPosition,
): Promise<{
  updatedLiturgyEvent: CpLiturgyEvent;
  updatedRoster: CpLiturgyRoster;
}> {
  const repo = liturgyRepo();
  const [user, roster, liturgyEvent] = await Promise.all([
    resolveUserFromServer(),
    repo.fetchOneLiturgyRoster({ position, liturgyEventId }),
    repo.fetchOneLiturgyEvent({ _id: liturgyEventId }),
  ]);

  if (!user || !roster || !liturgyEvent || !isLiturgyUser(user)) {
    throw Error("Unauthenticated");
  }
  if (roster.userId !== user._id) throw Error("Unauthorized");

  await notifyAdmin(
    `${user.name} has cancelled ${position} (${liturgyEventId})`,
  );
  const [updatedRoster, updatedLiturgyEvent] = await Promise.all([
    repo.saveLiturgyRoster({
      ...roster,
      status: CpLiturgyRosterStatus.Cancelled,
    }),
    repo.saveLiturgyEvent({
      ...liturgyEvent,
      cancellations: [
        ...(liturgyEvent.cancellations ?? []),
        { value: roster.userId },
      ],
    }),
  ]);
  return {
    updatedRoster: updatedRoster!,
    updatedLiturgyEvent: updatedLiturgyEvent!,
  };
}
