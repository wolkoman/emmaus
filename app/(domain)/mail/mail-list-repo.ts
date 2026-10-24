import { Mailbox } from "@/domain/mail/mailboxes";
import { pb } from "@/util/pocketbase";

export interface MailList {
  id: string;
  text: string;
  instructions: string;
  /** Addresses that get the daily digest of open mails. */
  notify: string[];
  updated: string;
}

/** One received mail run through the list update. */
export interface ListChange {
  id: string;
  uid: number;
  subject: string;
  from: string;
  /** Empty when the mail didn't change the list. */
  change: string;
  list_after: string;
  created: string;
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
      });
    });
  return { ...record, notify: record.notify ?? [] };
}

export async function saveNotify(list: MailList, notify: string[]) {
  const client = await pb();
  await client.collection("mail_lists").update(list.id, { notify });
}

/**
 * Saves only if nobody (person or the automatic update) changed the list
 * since `expectedUpdated` was read.
 */
export async function saveMailList(
  list: MailList,
  changes: Partial<Pick<MailList, "text" | "instructions">>,
  expectedUpdated: string,
) {
  const client = await pb();
  const current = await client
    .collection("mail_lists")
    .getOne<MailList>(list.id);
  if (current.updated !== expectedUpdated) throw new ListConflictError();
  return client.collection("mail_lists").update<MailList>(list.id, changes);
}

export async function addListChange(
  mailbox: Mailbox,
  change: Omit<ListChange, "id" | "created">,
) {
  const client = await pb();
  await client
    .collection("mail_list_changes")
    .create({ mailbox: mailbox.slug, ...change });
}

/** Newest first; only the ones that changed the list. */
export async function recentListChanges(mailbox: Mailbox, limit: number) {
  const client = await pb();
  const page = await client
    .collection("mail_list_changes")
    .getList<ListChange>(1, limit, {
      filter: client.filter("mailbox = {:m} && change != ''", {
        m: mailbox.slug,
      }),
      sort: "-created",
    });
  return page.items;
}

export async function listChangesForMail(mailbox: Mailbox, uid: number) {
  const client = await pb();
  return client.collection("mail_list_changes").getFullList<ListChange>({
    filter: client.filter("mailbox = {:m} && uid = {:uid}", {
      m: mailbox.slug,
      uid,
    }),
    sort: "created",
  });
}
