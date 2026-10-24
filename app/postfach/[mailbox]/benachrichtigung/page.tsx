import { Links } from "@/app/(shared)/Links";
import { requireMailbox } from "@/app/postfach/access";
import { NotifyEditor } from "@/app/postfach/NotifyEditor";
import { ContentLoading, PageHeading } from "@/components/intern/AppUI";
import { getMailList } from "@/domain/mail/mail-list-repo";
import { Suspense } from "react";

type Params = Promise<{ mailbox: string }>;

export default function NotifyPage(props: { params: Params }) {
  return (
    <Suspense fallback={<ContentLoading />}>
      <Notify params={props.params} />
    </Suspense>
  );
}

async function Notify(props: { params: Params }) {
  const { mailbox: slug } = await props.params;
  const { mailbox } = await requireMailbox(
    slug,
    Links.PostfachBenachrichtigung(slug),
  );
  const list = await getMailList(mailbox);

  return (
    <div className="flex max-w-3xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeading
        title="Benachrichtigung"
        description={`Diese Adressen bekommen jeden Morgen eine Übersicht der E-Mails an ${mailbox.address}, die noch auf Antwort warten. Ist nichts offen, wird nichts verschickt.`}
      />
      <NotifyEditor mailbox={mailbox.slug} addresses={list.notify} />
    </div>
  );
}
