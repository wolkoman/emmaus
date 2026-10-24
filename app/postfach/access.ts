import { Links } from "@/app/(shared)/Links";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { canReadMailbox, MAILBOXES } from "@/domain/mail/mailboxes";
import { notFound, redirect } from "next/navigation";

/** Every page checks itself: layouts render in parallel and don't guard. */
export async function requireMailbox(slug: string, path: string) {
  const person = await resolveUserFromServer();
  if (!person) redirect(Links.LoginRedirect(path));
  const mailbox = MAILBOXES.find((m) => m.slug === slug);
  if (!mailbox || !canReadMailbox(person, mailbox)) notFound();
  return { person, mailbox };
}
