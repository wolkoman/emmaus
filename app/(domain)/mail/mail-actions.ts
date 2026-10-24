"use server";

import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { DONE_FLAG, setFlag } from "@/domain/mail/imap";
import { updateListFromNewMails } from "@/domain/mail/list-updater";
import {
  getMailList,
  ListConflictError,
  saveMailList,
} from "@/domain/mail/mail-list-repo";
import { canReadMailbox, MAILBOXES } from "@/domain/mail/mailboxes";
import { revalidatePath } from "next/cache";

async function authorizedMailbox(slug: string) {
  const person = await resolveUserFromServer();
  const mailbox = MAILBOXES.find((m) => m.slug === slug);
  if (!person || !mailbox || !canReadMailbox(person, mailbox)) {
    throw new Error("No authorization");
  }
  return mailbox;
}

/** "Ohne Antwort als erledigt markieren", or undo it. */
export async function setMailDone(slug: string, uid: number, done: boolean) {
  const mailbox = await authorizedMailbox(slug);
  await setFlag(mailbox, "INBOX", uid, DONE_FLAG, done);
  revalidatePath(`/postfach/${slug}`, "layout");
}

/** false when someone else saved the list in the meantime. */
export async function saveListText(
  slug: string,
  text: string,
  instructions: string,
  expectedUpdated: string,
): Promise<boolean> {
  const mailbox = await authorizedMailbox(slug);
  const list = await getMailList(mailbox);
  try {
    await saveMailList(list, { text, instructions }, expectedUpdated);
  } catch (err) {
    if (err instanceof ListConflictError) return false;
    throw err;
  }
  revalidatePath(`/postfach/${slug}/liste`);
  return true;
}

export async function runListUpdate(slug: string): Promise<number> {
  const mailbox = await authorizedMailbox(slug);
  const count = await updateListFromNewMails(mailbox);
  revalidatePath(`/postfach/${slug}/liste`);
  return count;
}
