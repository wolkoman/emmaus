"use client";

import { Links } from "@/app/(shared)/Links";
import { MIN_PASSWORD_LENGTH } from "@/domain/users/password-policy";
import { resetPassword } from "@/domain/users/password-reset";
import { FormMessage, PasswordField } from "@/components/intern/PasswordField";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/UserStore";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const setJwt = useUserStore((state) => state.setJwt);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "invalid" | "error">(
    "idle",
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("loading");
    try {
      const jwt = await resetPassword(token, password);
      if (!jwt) return setState("invalid");
      await setJwt(jwt);
      router.push(Links.Intern);
    } catch {
      setState("error");
    }
  }

  if (!token || state === "invalid") {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage ok={false}>
          Dieser Link ist ungültig oder abgelaufen.
        </FormMessage>
        <Link
          href={Links.PasswortVergessen}
          className="text-emmaus text-sm underline-offset-2 hover:underline"
        >
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  const tooShort = password.length < MIN_PASSWORD_LENGTH;
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <PasswordField
        id="new-password"
        label="Neues Passwort"
        autoComplete="new-password"
        autoFocus
        value={password}
        onChange={setPassword}
      />
      <PasswordField
        id="new-password-repeat"
        label="Neues Passwort (wiederholen)"
        autoComplete="new-password"
        value={repeat}
        onChange={setRepeat}
      />
      <p className="text-sm text-black/60">
        Mindestens {MIN_PASSWORD_LENGTH} Zeichen.
      </p>
      {state === "error" && (
        <FormMessage ok={false}>
          Das Passwort konnte nicht gespeichert werden. Bitte versuchen Sie es
          erneut.
        </FormMessage>
      )}
      <Button
        type="submit"
        size="lg"
        className="mt-1 w-full"
        disabled={tooShort || password !== repeat}
        loading={state === "loading" || undefined}
      >
        Passwort speichern
      </Button>
    </form>
  );
}
