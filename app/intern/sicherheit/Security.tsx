"use client";

import { formatDate } from "@/app/(shared)/Localization";
import { changePasswordOnServer } from "@/domain/users/change-password-on-server";
import {
  finishPasskeyRegistration,
  getMyPasskeys,
  type PasskeyInfo,
  removePasskey,
  startPasskeyRegistration,
} from "@/domain/users/passkeys";
import { MIN_PASSWORD_LENGTH } from "@/domain/users/password-policy";
import { AppCard, SectionHeading } from "@/components/intern/AppUI";
import { FormMessage, PasswordField } from "@/components/intern/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startRegistration } from "@simplewebauthn/browser";
import { FormEvent, useEffect, useState } from "react";

export function SecuritySections(props: { admin: boolean }) {
  return (
    <>
      <ChangePassword admin={props.admin} />
      <Passkeys />
    </>
  );
}

function ChangePassword(props: { admin: boolean }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const ok = await changePasswordOnServer(current, password)
      .then(() => true)
      .catch(() => false);
    setResult(ok);
    setLoading(false);
    setCurrent("");
    setPassword("");
    setRepeat("");
  }

  return (
    <section>
      <SectionHeading
        title="Passwort ändern"
        description={
          props.admin ? (
            <>
              Hier ändern Sie Ihr Passwort für die Website. Ihr Admin-Passwort
              für Pocketbase, mit dem Sie sich hier ebenfalls anmelden können,
              lässt sich nur in{" "}
              <a
                href="https://db.emmaus.wien/_/"
                className="text-emmaus underline-offset-2 hover:underline"
              >
                Pocketbase
              </a>{" "}
              ändern.
            </>
          ) : undefined
        }
      />
      <form onSubmit={save} className="flex flex-col gap-4">
        <PasswordField
          id="current-password"
          label="Aktuelles Passwort"
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
        />
        <PasswordField
          id="new-password"
          label="Neues Passwort"
          autoComplete="new-password"
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
        {result === true && (
          <FormMessage ok>Das Passwort wurde geändert.</FormMessage>
        )}
        {result === false && (
          <FormMessage ok={false}>
            Das Passwort konnte nicht geändert werden. Stimmt das aktuelle
            Passwort?
          </FormMessage>
        )}
        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          loading={loading || undefined}
          disabled={
            current.length === 0 ||
            password.length < MIN_PASSWORD_LENGTH ||
            password !== repeat
          }
        >
          Passwort speichern
        </Button>
      </form>
    </section>
  );
}

function Passkeys() {
  const [passkeys, setPasskeys] = useState<PasskeyInfo[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = () => getMyPasskeys().then(setPasskeys);
  useEffect(() => {
    reload().catch(() => setPasskeys([]));
  }, []);

  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const optionsJSON = await startPasskeyRegistration();
      const response = await startRegistration({ optionsJSON });
      await finishPasskeyRegistration(response, name);
      setName("");
      await reload();
    } catch (err) {
      // Closing the browser dialog is not an error worth showing.
      if (!(err instanceof Error && err.name === "NotAllowedError")) {
        setError(
          err instanceof Error && err.name === "InvalidStateError"
            ? "Dieses Gerät ist bereits als Passkey hinterlegt."
            : "Der Passkey konnte nicht hinzugefügt werden.",
        );
      }
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!window.confirm("Diesen Passkey wirklich entfernen?")) return;
    await removePasskey(id).catch(() =>
      setError("Der Passkey konnte nicht entfernt werden."),
    );
    await reload();
  }

  return (
    <section>
      <SectionHeading
        title="Passkeys"
        description="Mit einem Passkey melden Sie sich per Fingerabdruck, Gesichtserkennung oder Geräte-PIN an, ganz ohne Passwort."
      />
      {passkeys && passkeys.length > 0 && (
        <AppCard className="mb-4 divide-y divide-neutral-200">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold">{passkey.name}</div>
                <div className="text-sm text-black/60">
                  Hinzugefügt am{" "}
                  {formatDate(passkey.created, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {passkey.lastUsed &&
                    `, zuletzt verwendet am ${formatDate(passkey.lastUsed, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}`}
                </div>
              </div>
              <Button variant="outline" onClick={() => remove(passkey.id)}>
                Entfernen
              </Button>
            </div>
          ))}
        </AppCard>
      )}
      <form onSubmit={add} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="passkey-name">Name des Geräts</Label>
          <Input
            id="passkey-name"
            className="h-10 bg-white"
            placeholder="z.B. iPhone"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        {error && <FormMessage ok={false}>{error}</FormMessage>}
        <Button
          type="submit"
          size="lg"
          variant="outline"
          className="w-full"
          loading={busy || undefined}
        >
          Passkey hinzufügen
        </Button>
      </form>
    </section>
  );
}
