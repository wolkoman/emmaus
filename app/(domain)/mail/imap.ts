import { Mailbox } from "@/domain/mail/mailboxes";
import { FetchMessageObject, ImapFlow } from "imapflow";
import { ParsedMail, simpleParser } from "mailparser";

const PAGE_SIZE = 100;

/** IMAP keywords, so Thunderbird & co. see the same state as the website. */
export const DONE_FLAG = "$Erledigt";
export const LISTED_FLAG = "$Ausgewertet";

/** Every received mail is open until it is answered or explicitly done. */
export type MailStatus = "offen" | "beantwortet" | "erledigt";

export interface MailSummary {
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: string;
  status: MailStatus;
}

export function mailboxPassword(mailbox: Mailbox) {
  const password = process.env[mailbox.passwordEnv];
  if (!password) throw new Error(`${mailbox.passwordEnv} is not set`);
  return password;
}

async function withFolder<T>(
  mailbox: Mailbox,
  path: string,
  run: (client: ImapFlow) => Promise<T>,
): Promise<T> {
  const client = new ImapFlow({
    host: process.env.IMAP_SERVER!,
    port: 993,
    secure: true,
    auth: { user: mailbox.address, pass: mailboxPassword(mailbox) },
    logger: false,
  });
  await client.connect();
  try {
    const lock = await client.getMailboxLock(path);
    try {
      return await run(client);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

/** Our own mails in the inbox (tests, Bcc) never need an answer. */
function statusOf(flags?: Set<string>, ownMail?: boolean): MailStatus {
  if (flags?.has("\\Answered")) return "beantwortet";
  if (flags?.has(DONE_FLAG) || ownMail) return "erledigt";
  return "offen";
}

/** Newest first; only the last PAGE_SIZE messages of the folder. */
export function listMails(mailbox: Mailbox, path: string) {
  return withFolder(mailbox, path, async (client) => {
    const exists = client.mailbox ? client.mailbox.exists : 0;
    if (exists === 0) return [];
    const mails: MailSummary[] = [];
    const range = `${Math.max(1, exists - PAGE_SIZE + 1)}:*`;
    for await (const message of client.fetch(range, {
      uid: true,
      envelope: true,
      flags: true,
      internalDate: true,
    })) {
      const envelope = message.envelope;
      mails.push({
        uid: message.uid,
        subject: envelope?.subject || "(kein Betreff)",
        from: formatAddresses(envelope?.from),
        to: formatAddresses(envelope?.to),
        date: new Date(
          envelope?.date ?? message.internalDate ?? Date.now(),
        ).toISOString(),
        status: statusOf(
          message.flags,
          envelope?.from?.some((a) => a.address === mailbox.address),
        ),
      });
    }
    return mails.reverse();
  });
}

/** Fetches and parses one message without changing any flag. */
export function readMail(
  mailbox: Mailbox,
  path: string,
  uid: number,
): Promise<{ mail: ParsedMail; status: MailStatus } | undefined> {
  return withFolder(mailbox, path, async (client) => {
    const message = await client.fetchOne(
      String(uid),
      { source: true, flags: true },
      { uid: true },
    );
    if (!message || !message.source) return undefined;
    const mail = await simpleParser(message.source);
    const ownMail = mail.from?.value.some((a) => a.address === mailbox.address);
    return { mail, status: statusOf(message.flags, ownMail) };
  });
}

export function setFlag(
  mailbox: Mailbox,
  path: string,
  uid: number,
  flag: string,
  on: boolean,
) {
  return withFolder(mailbox, path, (client) =>
    on
      ? client.messageFlagsAdd(String(uid), [flag], { uid: true })
      : client.messageFlagsRemove(String(uid), [flag], { uid: true }),
  );
}

/** Received mails not yet run through the list update, oldest first. */
export function unlistedMails(mailbox: Mailbox, limit: number) {
  return withFolder(mailbox, "INBOX", async (client) => {
    const uids = await client.search({ unKeyword: LISTED_FLAG }, { uid: true });
    if (!uids || uids.length === 0) return [];
    const messages: FetchMessageObject[] = [];
    for await (const message of client.fetch(
      uids
        .sort((a, b) => a - b)
        .slice(0, limit)
        .join(","),
      { uid: true, source: true },
      { uid: true },
    )) {
      messages.push(message);
    }
    return Promise.all(
      messages
        .sort((a, b) => a.uid - b.uid)
        .map(async (message) => ({
          uid: message.uid,
          mail: await simpleParser(message.source!),
        })),
    );
  });
}

export function appendToFolder(mailbox: Mailbox, path: string, raw: Buffer) {
  return withFolder(mailbox, path, (client) =>
    client.append(path, raw, ["\\Seen"]),
  );
}

function formatAddresses(list?: { name?: string; address?: string }[]) {
  return (list ?? [])
    .map((entry) => entry.name || entry.address || "")
    .filter(Boolean)
    .join(", ");
}
