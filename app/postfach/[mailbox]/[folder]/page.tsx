import { Links } from "@/app/(shared)/Links";
import { requireMailbox } from "@/app/postfach/access";
import { formatMailDate } from "@/app/postfach/format";
import {
  AppTable,
  AppTableHeader,
  AppTableRow,
} from "@/components/intern/AppTable";
import { ContentLoading, PageHeading } from "@/components/intern/AppUI";
import { listMails } from "@/domain/mail/imap";
import { isMailFolder, MAIL_FOLDERS } from "@/domain/mail/mailboxes";
import { cn } from "@/util/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StatusIcon } from "@/app/postfach/StatusIcon";

const COLUMNS = "grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_7rem] gap-3";

type Params = Promise<{ mailbox: string; folder: string }>;

export default function FolderPage(props: { params: Params }) {
  return (
    <Suspense fallback={<ContentLoading />}>
      <Folder params={props.params} />
    </Suspense>
  );
}

async function Folder(props: { params: Params }) {
  const { mailbox: slug, folder } = await props.params;
  if (!isMailFolder(folder)) notFound();
  const { mailbox } = await requireMailbox(
    slug,
    Links.PostfachOrdner(slug, folder),
  );
  const mails = await listMails(mailbox, MAIL_FOLDERS[folder].path);
  const sent = folder === "gesendet";
  const open = sent ? 0 : mails.filter((m) => m.status === "offen").length;

  return (
    <div className="flex flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeading
        title={MAIL_FOLDERS[folder].title}
        description={
          sent
            ? mailbox.address
            : open === 0
              ? "Alle E-Mails sind beantwortet oder erledigt."
              : `${open} ${open === 1 ? "E-Mail wartet" : "E-Mails warten"} auf Antwort.`
        }
      />
      {mails.length === 0 ? (
        <p className="text-black/60">Keine E-Mails.</p>
      ) : (
        <AppTable>
          <AppTableHeader className={COLUMNS}>
            <span>{sent ? "An" : "Von"}</span>
            <span>Betreff</span>
            <span className="text-right">Datum</span>
          </AppTableHeader>
          {mails.map((mail) => (
            <Link
              key={mail.uid}
              href={Links.PostfachMail(mailbox.slug, folder, mail.uid)}
              className="block"
            >
              <AppTableRow
                className={cn(
                  COLUMNS,
                  !sent && mail.status === "offen" && "font-semibold",
                )}
              >
                <span className="truncate">{sent ? mail.to : mail.from}</span>
                <span className="flex min-w-0 items-center gap-1.5">
                  {!sent && <StatusIcon status={mail.status} />}
                  <span className="truncate">{mail.subject}</span>
                </span>
                <span className="text-right text-sm text-black/60">
                  {formatMailDate(mail.date)}
                </span>
              </AppTableRow>
            </Link>
          ))}
        </AppTable>
      )}
    </div>
  );
}
