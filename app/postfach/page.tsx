import { Links } from "@/app/(shared)/Links";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { AppLoading } from "@/components/intern/AppShell";
import { mailboxesFor } from "@/domain/mail/mailboxes";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

export default function PostfachPage() {
  return (
    <Suspense fallback={<AppLoading title="Postfach" />}>
      <FirstMailbox />
    </Suspense>
  );
}

async function FirstMailbox(): Promise<never> {
  const person = await resolveUserFromServer();
  if (!person) redirect(Links.LoginRedirect(Links.Postfach));
  const [mailbox] = mailboxesFor(person);
  if (!mailbox) notFound();
  redirect(Links.PostfachOrdner(mailbox.slug, "posteingang"));
}
