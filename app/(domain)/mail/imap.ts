import { Mailbox } from "@/domain/mail/mailboxes";
import { ImapFlow } from "imapflow";
import { ParsedMail, simpleParser } from "mailparser";

const PAGE_SIZE = 100;

export interface MailSummary {
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: string;
  seen: boolean;
  answered: boolean;
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
        seen: !!message.flags?.has("\\Seen"),
        answered: !!message.flags?.has("\\Answered"),
      });
    }
    return mails.reverse();
  });
}

/** Fetches and parses one message; opening it marks it as read. */
export function readMail(
  mailbox: Mailbox,
  path: string,
  uid: number,
): Promise<ParsedMail | undefined> {
  return withFolder(mailbox, path, async (client) => {
    const message = await client.fetchOne(
      String(uid),
      { source: true },
      { uid: true },
    );
    if (!message || !message.source) return undefined;
    await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
    return simpleParser(message.source);
  });
}

export function markAnswered(mailbox: Mailbox, path: string, uid: number) {
  return withFolder(mailbox, path, (client) =>
    client.messageFlagsAdd(String(uid), ["\\Answered"], { uid: true }),
  );
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
