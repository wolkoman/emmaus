import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { readMail } from "@/domain/mail/imap";
import {
  canReadMailbox,
  isMailFolder,
  MAIL_FOLDERS,
  MAILBOXES,
} from "@/domain/mail/mailboxes";

export async function GET(
  _request: Request,
  props: {
    params: Promise<{
      mailbox: string;
      folder: string;
      uid: string;
      index: string;
    }>;
  },
) {
  const { mailbox: slug, folder, uid, index } = await props.params;
  const person = await resolveUserFromServer();
  const mailbox = MAILBOXES.find((m) => m.slug === slug);
  if (!person || !mailbox || !canReadMailbox(person, mailbox)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!isMailFolder(folder)) return new Response("Not found", { status: 404 });

  const mail = await readMail(mailbox, MAIL_FOLDERS[folder].path, Number(uid));
  const attachment = mail?.attachments[Number(index)];
  if (!attachment) return new Response("Not found", { status: 404 });

  const filename = attachment.filename ?? `anhang-${index}`;
  return new Response(new Uint8Array(attachment.content), {
    headers: {
      "Content-Type": attachment.contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
