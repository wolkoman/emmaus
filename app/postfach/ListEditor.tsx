"use client";

import { AppCard } from "@/components/intern/AppUI";
import { FormMessage } from "@/components/intern/PasswordField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runListUpdate, saveListText } from "@/domain/mail/mail-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PiArrowsClockwise, PiFloppyDisk } from "react-icons/pi";

/** Remount with `key={updated}` so a refresh shows the saved list. */
export function ListEditor(props: {
  mailbox: string;
  text: string;
  instructions: string;
  updated: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(props.text);
  const [instructions, setInstructions] = useState(props.instructions);
  const [busy, setBusy] = useState<"save" | "update" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const dirty = text !== props.text || instructions !== props.instructions;

  async function save() {
    setBusy("save");
    const ok = await saveListText(
      props.mailbox,
      text,
      instructions,
      props.updated,
    ).catch(() => null);
    setBusy(null);
    if (ok) return router.refresh();
    setMessage({
      ok: false,
      text:
        ok === false
          ? "Die Liste wurde inzwischen geändert. Bitte Ihre Änderung kopieren und die Seite neu laden."
          : "Die Liste konnte nicht gespeichert werden.",
    });
  }

  async function update() {
    setBusy("update");
    const count = await runListUpdate(props.mailbox).catch(() => null);
    setBusy(null);
    if (count === null) {
      setMessage({ ok: false, text: "Die Auswertung ist fehlgeschlagen." });
    } else if (count === 0) {
      setMessage({ ok: true, text: "Keine neuen E-Mails." });
    } else {
      router.refresh();
    }
  }

  return (
    <AppCard className="flex flex-col gap-4 p-5">
      <Textarea
        aria-label="Liste"
        rows={18}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <details>
        <summary className="cursor-pointer text-sm text-black/60">
          Anleitung für die automatische Auswertung
        </summary>
        <div className="mt-3 flex flex-col gap-1.5">
          <Label htmlFor="list-instructions" className="sr-only">
            Anleitung
          </Label>
          <Textarea
            id="list-instructions"
            rows={5}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
      </details>
      {message && <FormMessage ok={message.ok}>{message.text}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={save}
          disabled={!dirty || busy !== null}
          loading={busy === "save" || undefined}
        >
          <PiFloppyDisk /> Speichern
        </Button>
        <Button
          variant="outline"
          onClick={update}
          disabled={dirty || busy !== null}
          loading={busy === "update" || undefined}
        >
          <PiArrowsClockwise /> Neue E-Mails jetzt auswerten
        </Button>
      </div>
    </AppCard>
  );
}
