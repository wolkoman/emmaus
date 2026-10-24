import { Links } from "@/app/(shared)/Links";
import { requireMailbox } from "@/app/postfach/access";
import { MailForm } from "@/app/postfach/MailForm";
import {
  AppCard,
  ContentLoading,
  PageHeading,
} from "@/components/intern/AppUI";
import { Suspense } from "react";

type Params = Promise<{ mailbox: string }>;

export default function NewMailPage(props: { params: Params }) {
  return (
    <Suspense fallback={<ContentLoading />}>
      <NewMail params={props.params} />
    </Suspense>
  );
}

async function NewMail(props: { params: Params }) {
  const { mailbox: slug } = await props.params;
  const { mailbox } = await requireMailbox(slug, Links.PostfachNeu(slug));
  return (
    <div className="flex max-w-3xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeading
        title="Neue E-Mail"
        description={`Wird von ${mailbox.address} gesendet.`}
      />
      <AppCard className="p-5">
        <MailForm mailbox={mailbox.slug} />
      </AppCard>
    </div>
  );
}
