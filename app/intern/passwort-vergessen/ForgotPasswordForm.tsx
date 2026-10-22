"use client";

import { Links } from "@/app/(shared)/Links";
import { requestPasswordReset } from "@/domain/users/password-reset";
import { FormMessage } from "@/components/intern/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("loading");
    await requestPasswordReset(identifier)
      .then(() => setState("sent"))
      .catch(() => setState("error"));
  }

  if (state === "sent") {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage ok>
          Falls es einen Zugang mit diesen Angaben und einer hinterlegten
          E-Mail-Adresse gibt, haben wir Ihnen einen Link geschickt. Bitte sehen
          Sie auch im Spam-Ordner nach.
        </FormMessage>
        <Link
          href={Links.Login}
          className="text-emmaus text-sm underline-offset-2 hover:underline"
        >
          Zurück zur Anmeldung
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-identifier">Benutzername oder E-Mail</Label>
        <Input
          id="reset-identifier"
          className="h-10 bg-white"
          autoComplete="username"
          autoFocus
          value={identifier}
          disabled={state === "loading"}
          onChange={(event) => setIdentifier(event.target.value)}
        />
      </div>
      {state === "error" && (
        <FormMessage ok={false}>
          Das hat leider nicht geklappt. Bitte versuchen Sie es später erneut.
        </FormMessage>
      )}
      <Button
        type="submit"
        size="lg"
        className="mt-1 w-full"
        disabled={identifier.trim().length === 0}
        loading={state === "loading" || undefined}
      >
        Link anfordern
      </Button>
      <Link
        href={Links.Login}
        className="text-emmaus text-sm underline-offset-2 hover:underline"
      >
        Zurück zur Anmeldung
      </Link>
    </form>
  );
}
