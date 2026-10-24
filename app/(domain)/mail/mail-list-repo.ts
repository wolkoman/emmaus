import { Mailbox } from "@/domain/mail/mailboxes";
import { pb } from "@/util/pocketbase";

const HISTORY_LENGTH = 30;

export interface ListChange {
  at: string;
  uid: number;
  subject: string;
  from: string;
  change: string;
}

export interface MailList {
  id: string;
  text: string;
  instructions: string;
  history: ListChange[];
  updated: string;
}

export class ListConflictError extends Error {}

export async function getMailList(mailbox: Mailbox): Promise<MailList> {
  const client = await pb();
  const collection = client.collection("mail_lists");
  const record = await collection
    .getFirstListItem<MailList>(
      client.filter("mailbox = {:m}", { m: mailbox.slug }),
    )
    .catch(async (err) => {
      if (err?.status !== 404) throw err;
      return collection.create<MailList>({
        mailbox: mailbox.slug,
        text: "",
        instructions: mailbox.list?.defaultInstructions ?? "",
        history: [],
      });
    });
  return { ...record, history: record.history ?? [] };
}

/**
 * Saves only if nobody (person or the automatic update) changed the list
 * since `expectedUpdated` was read.
 */
export async function saveMailList(
  list: MailList,
  changes: Partial<Pick<MailList, "text" | "instructions">> & {
    addHistory?: ListChange;
  },
  expectedUpdated: string,
) {
  const client = await pb();
  const current = await client
    .collection("mail_lists")
    .getOne<MailList>(list.id);
  if (current.updated !== expectedUpdated) throw new ListConflictError();
  const { addHistory, ...fields } = changes;
  return client.collection("mail_lists").update<MailList>(list.id, {
    ...fields,
    ...(addHistory && {
      history: [addHistory, ...(current.history ?? [])].slice(
        0,
        HISTORY_LENGTH,
      ),
    }),
  });
}
