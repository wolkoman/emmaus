import { sendMailDigests } from "@/domain/mail/digest";
import { NextResponse } from "next/server";

// Triggered every morning by the emmaus-mail-digest CronJob (deploy/helm).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Without a secret `Bearer undefined` would match, so refuse instead.
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json({ sent: await sendMailDigests() });
}
