import { sendMailDigests } from "@/domain/mail/digest";
import { NextResponse } from "next/server";

// Triggered every morning by the emmaus-mail-digest CronJob (deploy/helm).
export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json({ sent: await sendMailDigests() });
}
