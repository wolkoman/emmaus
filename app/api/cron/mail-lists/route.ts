import { updateListFromNewMails } from "@/domain/mail/list-updater";
import { MAILBOXES } from "@/domain/mail/mailboxes";
import { NextResponse } from "next/server";

// Triggered every 10 minutes by the emmaus-mail-lists CronJob (deploy/helm).
export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const processed: Record<string, number> = {};
  for (const mailbox of MAILBOXES.filter((m) => m.list)) {
    processed[mailbox.slug] = await updateListFromNewMails(mailbox);
  }
  return NextResponse.json({ processed });
}
