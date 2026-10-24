"use client";

import { AppCard } from "@/components/intern/AppUI";
import { FormMessage } from "@/components/intern/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setNotifyAddress } from "@/domain/mail/mail-actions";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PiPlus, PiTrash } from "react-icons/pi";

export function NotifyEditor(props: { mailbox: string; addresses: string[] }) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function change(email: string, subscribed: boolean) {
    setBusy(email);
    setError(false);
    try {
      await setNotifyAddress(props.mailbox, email, subscribed);
      if (subscribed) setAddress("");
      router.refresh();
    } catch {
      setError(true);
    }
    setBusy(null);
  }

  function add(event: FormEvent) {
    event.preventDefault();
    change(address, true);
  }

  return (
    <AppCard className="flex flex-col gap-4 p-5">
      {props.addresses.length === 0 ? (
        <p className="text-sm text-black/60">Noch niemand eingetragen.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {props.addresses.map((email) => (
            <li
              key={email}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="truncate">{email}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`${email} austragen`}
                loading={busy === email || undefined}
                onClick={() => change(email, false)}
              >
                <PiTrash /> Austragen
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="flex gap-2">
        <Input
          type="email"
          required
          placeholder="name@example.org"
          aria-label="E-Mail-Adresse eintragen"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button type="submit" loading={busy === address || undefined}>
          <PiPlus /> Eintragen
        </Button>
      </form>
      {error && (
        <FormMessage ok={false}>
          Die Adresse konnte nicht gespeichert werden.
        </FormMessage>
      )}
    </AppCard>
  );
}
