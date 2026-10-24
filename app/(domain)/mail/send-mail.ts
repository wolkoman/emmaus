"use server";

import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import {
  appendToFolder,
  mailboxPassword,
  markAnswered,
  readMail,
} from "@/domain/mail/imap";
import {
  canReadMailbox,
  MAIL_FOLDERS,
  MailFolder,
  MAILBOXES,
} from "@/domain/mail/mailboxes";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";

export interface OutgoingMail {
  mailbox: string;
  to: string;
  subject: string;
  text: string;
  /** The message being answered, for threading and the \Answered flag. */
  replyTo?: { folder: MailFolder; uid: number };
}

export async function sendMail(mail: OutgoingMail): Promise<void> {
  const person = await resolveUserFromServer();
  const mailbox = MAILBOXES.find((m) => m.slug === mail.mailbox);
  if (!person || !mailbox || !canReadMailbox(person, mailbox)) {
    throw new Error("No authorization");
  }
  if (!mail.to.trim() || !mail.subject.trim() || !mail.text.trim()) {
    throw new Error("Empfänger, Betreff und Text sind nötig.");
  }

  const original = mail.replyTo
    ? await readMail(
        mailbox,
        MAIL_FOLDERS[mail.replyTo.folder].path,
        mail.replyTo.uid,
      )
    : undefined;
  const references = [
    ...[original?.references ?? []].flat(),
    original?.messageId,
  ].filter((id): id is string => !!id);

  const raw = await new MailComposer({
    from: { name: "Pfarre Emmaus am Wienerberg", address: mailbox.address },
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    inReplyTo: original?.messageId,
    references,
    // Shows the team who wrote it; everyone sends from the same address.
    headers: { "X-Emmaus-Sender": person.name },
  })
    .compile()
    .build();

  await nodemailer
    .createTransport({
      host: process.env.EMAIL_SERVER!,
      port: 587,
      secure: false,
      auth: { user: mailbox.address, pass: mailboxPassword(mailbox) },
    })
    .sendMail({
      envelope: { from: mailbox.address, to: mail.to },
      raw,
    });

  await appendToFolder(mailbox, MAIL_FOLDERS.gesendet.path, raw);
  if (mail.replyTo) {
    await markAnswered(
      mailbox,
      MAIL_FOLDERS[mail.replyTo.folder].path,
      mail.replyTo.uid,
    );
  }
}
