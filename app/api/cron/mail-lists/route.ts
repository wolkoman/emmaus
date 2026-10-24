import { updateListFromNewMails } from "@/domain/mail/list-updater";
import { MAILBOXES } from "@/domain/mail/mailboxes";
import { NextResponse } from "next/server";

// Triggered every 10 minutes by the emmaus-mail-lists CronJob (deploy/helm).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Without a secret `Bearer undefined` would match, so refuse instead.
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const processed: Record<string, number> = {};
  for (const mailbox of MAILBOXES.filter((m) => m.list)) {
    processed[mailbox.slug] = await updateListFromNewMails(mailbox);
  }
  return NextResponse.json({ processed });
}
