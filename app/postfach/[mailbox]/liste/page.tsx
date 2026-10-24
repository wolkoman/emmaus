import { Links } from "@/app/(shared)/Links";
import { requireMailbox } from "@/app/postfach/access";
import { formatMailDate } from "@/app/postfach/format";
import { ListEditor } from "@/app/postfach/ListEditor";
import {
  AppCard,
  ContentLoading,
  PageHeading,
  SectionHeading,
} from "@/components/intern/AppUI";
import { getMailList, recentListChanges } from "@/domain/mail/mail-list-repo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Params = Promise<{ mailbox: string }>;

export default function ListPage(props: { params: Params }) {
  return (
    <Suspense fallback={<ContentLoading />}>
      <List params={props.params} />
    </Suspense>
  );
}

async function List(props: { params: Params }) {
  const { mailbox: slug } = await props.params;
  const { mailbox } = await requireMailbox(slug, Links.PostfachListe(slug));
  if (!mailbox.list) notFound();
  const [list, changes] = await Promise.all([
    getMailList(mailbox),
    recentListChanges(mailbox, 30),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6 px-4 py-8 lg:px-8">
      <PageHeading
        title={mailbox.list.title}
        description="Wird bei jeder neuen E-Mail automatisch ergänzt und lässt sich hier jederzeit von Hand ändern."
      />
      <ListEditor
        key={list.updated}
        mailbox={mailbox.slug}
        text={list.text}
        instructions={list.instructions}
        updated={list.updated}
      />
      {changes.length > 0 && (
        <section>
          <SectionHeading title="Automatische Änderungen" />
          <AppCard className="divide-y divide-neutral-100">
            {changes.map((entry) => (
              <div key={entry.id} className="px-5 py-3">
                <div className="text-sm">{entry.change}</div>
                <Link
                  href={Links.PostfachMail(slug, "posteingang", entry.uid)}
                  className="text-sm text-black/60 hover:underline"
                >
                  {formatMailDate(entry.created)}: {entry.from}, „
                  {entry.subject}“
                </Link>
              </div>
            ))}
          </AppCard>
        </section>
      )}
    </div>
  );
}
