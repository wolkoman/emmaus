"use client";

import { Button } from "@/components/ui/button";
import { setMailDone } from "@/domain/mail/mail-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PiArrowCounterClockwise, PiCheck } from "react-icons/pi";

export function MailDoneButton(props: {
  mailbox: string;
  uid: number;
  done: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await setMailDone(props.mailbox, props.uid, !props.done);
    router.refresh();
    setBusy(false);
  }

  return (
    <Button variant="outline" onClick={toggle} loading={busy || undefined}>
      {props.done ? (
        <>
          <PiArrowCounterClockwise /> Wieder öffnen
        </>
      ) : (
        <>
          <PiCheck /> Ohne Antwort als erledigt markieren
        </>
      )}
    </Button>
  );
}
