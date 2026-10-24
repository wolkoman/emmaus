"use client";

import { Links } from "@/app/(shared)/Links";
import { FormMessage } from "@/components/intern/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OutgoingMail, sendMail } from "@/domain/mail/send-mail";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PiPaperPlaneTilt } from "react-icons/pi";

/** New mail or reply; sends from the mailbox address. */
export function MailForm(props: {
  mailbox: string;
  to?: string;
  subject?: string;
  text?: string;
  replyTo?: OutgoingMail["replyTo"];
}) {
  const router = useRouter();
  const [to, setTo] = useState(props.to ?? "");
  const [subject, setSubject] = useState(props.subject ?? "");
  const [text, setText] = useState(props.text ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(false);
    try {
      await sendMail({
        mailbox: props.mailbox,
        to,
        subject,
        text,
        replyTo: props.replyTo,
      });
      router.push(Links.PostfachOrdner(props.mailbox, "gesendet"));
    } catch {
      setError(true);
      setSending(false);
    }
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-to">An</Label>
        <Input
          id="mail-to"
          type="email"
          multiple
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-subject">Betreff</Label>
        <Input
          id="mail-subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-text">Nachricht</Label>
        <Textarea
          id="mail-text"
          required
          rows={14}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {error && (
        <FormMessage ok={false}>
          Die E-Mail konnte nicht gesendet werden.
        </FormMessage>
      )}
      <div>
        <Button type="submit" loading={sending || undefined}>
          <PiPaperPlaneTilt /> Senden
        </Button>
      </div>
    </form>
  );
}
