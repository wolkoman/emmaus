import { Links } from "@/app/(shared)/Links";
import { requireMailbox } from "@/app/postfach/access";
import { formatMailDateTime } from "@/app/postfach/format";
import { MailForm } from "@/app/postfach/MailForm";
import {
  AppCard,
  ContentLoading,
  PageHeading,
  SectionHeading,
} from "@/components/intern/AppUI";
import { readMail } from "@/domain/mail/imap";
import { isMailFolder, MAIL_FOLDERS } from "@/domain/mail/mailboxes";
import { AddressObject, ParsedMail } from "mailparser";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PiPaperclip } from "react-icons/pi";

type Params = Promise<{ mailbox: string; folder: string; uid: string }>;

export default function MailPage(props: { params: Params }) {
  return (
    <Suspense fallback={<ContentLoading />}>
      <Mail params={props.params} />
    </Suspense>
  );
}

async function Mail(props: { params: Params }) {
  const { mailbox: slug, folder, uid: uidParam } = await props.params;
  const uid = Number(uidParam);
  if (!isMailFolder(folder) || !Number.isInteger(uid)) notFound();
  const { mailbox } = await requireMailbox(
    slug,
    Links.PostfachMail(slug, folder, uid),
  );
  const mail = await readMail(mailbox, MAIL_FOLDERS[folder].path, uid);
  if (!mail) notFound();

  const sender = mail.headers.get("x-emmaus-sender");
  const facts: [string, string | undefined][] = [
    ["Von", mail.from?.text],
    ["An", addressText(mail.to)],
    ["Cc", addressText(mail.cc)],
    ["Datum", mail.date && formatMailDateTime(mail.date)],
    ["Geschrieben von", typeof sender === "string" ? sender : undefined],
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeading title={mail.subject || "(kein Betreff)"} />
      <AppCard>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-neutral-200 p-5 text-sm">
          {facts
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-black/60">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
        </dl>
        <div className="p-5 break-words whitespace-pre-wrap">
          {mail.text?.trim() || "(kein Text)"}
        </div>
        {mail.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-neutral-200 p-5">
            {mail.attachments.map((attachment, index) => (
              <a
                key={index}
                href={`${Links.PostfachMail(slug, folder, uid)}/anhang/${index}`}
                className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                <PiPaperclip />
                {attachment.filename ?? `Anhang ${index + 1}`}
              </a>
            ))}
          </div>
        )}
      </AppCard>
      {folder === "posteingang" && (
        <section>
          <SectionHeading title="Antworten" />
          <AppCard className="p-5">
            <MailForm
              mailbox={mailbox.slug}
              to={replyAddress(mail)}
              subject={replySubject(mail.subject)}
              text={quote(mail)}
              replyTo={{ folder, uid }}
            />
          </AppCard>
        </section>
      )}
    </div>
  );
}

function addressText(value?: AddressObject | AddressObject[]) {
  return (
    [value ?? []]
      .flat()
      .map((a) => a.text)
      .join(", ") || undefined
  );
}

function replyAddress(mail: ParsedMail) {
  return (mail.replyTo ?? mail.from)?.value[0]?.address ?? "";
}

function replySubject(subject?: string) {
  if (!subject) return "Re:";
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

function quote(mail: ParsedMail) {
  const quoted = (mail.text ?? "")
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  const date = mail.date ? `Am ${formatMailDateTime(mail.date)} schrieb` : "";
  return `\n\n${date || "Es schrieb"} ${mail.from?.text ?? ""}:\n${quoted}`;
}
