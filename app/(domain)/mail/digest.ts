import { Links } from "@/app/(shared)/Links";
import { mailOptions, transporter } from "@/app/(shared)/mail/sendMail";
import { formatMailDate } from "@/app/postfach/format";
import { listMails } from "@/domain/mail/imap";
import { getMailList } from "@/domain/mail/mail-list-repo";
import { MAILBOXES } from "@/domain/mail/mailboxes";
import MailDigest from "@/emails/mail-digest";
import { render } from "@react-email/components";

/** One mail per subscriber and mailbox, only while something is open. */
export async function sendMailDigests() {
  const sent: Record<string, number> = {};
  for (const mailbox of MAILBOXES) {
    const { notify } = await getMailList(mailbox);
    if (notify.length === 0) continue;
    const open = (await listMails(mailbox, "INBOX")).filter(
      (mail) => mail.status === "offen",
    );
    if (open.length === 0) continue;

    const html = await render(
      MailDigest({
        address: mailbox.address,
        url: `https://emmaus.wien${Links.PostfachOrdner(mailbox.slug, "posteingang")}`,
        mails: open.map((mail) => ({
          subject: mail.subject,
          from: mail.from,
          date: formatMailDate(mail.date),
        })),
      }),
    );
    for (const to of notify) {
      await transporter.sendMail({
        ...mailOptions,
        to,
        replyTo: mailbox.address,
        subject: `${open.length} offene E-Mail${open.length === 1 ? "" : "s"} an ${mailbox.address}`,
        html,
      });
    }
    sent[mailbox.slug] = notify.length;
  }
  return sent;
}
