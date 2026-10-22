"use client";

import { useState } from "@/app/(shared)/use-state-util";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { finishPasskeyLogin, startPasskeyLogin } from "@/domain/users/passkeys";
import { InvalidCredentialsError, useUserStore } from "@/store/UserStore";
import { startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect } from "react";
import { Links } from "../../(shared)/Links";

/** Only paths on this site, so the login link can't send people elsewhere. */
function safeRedirect(target: string | null) {
  if (!target) return undefined;
  try {
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return undefined;
    return url.pathname + url.search + url.hash;
  } catch {
    return undefined;
  }
}

export function LoginPage() {
  const [data, setData, setPartialData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, _login, setJwt] = useUserStore((state) => [
    state.person,
    state.login,
    state.setJwt,
    state,
  ]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user?.active) {
      setData({ username: "", password: "" });
    }
  }, [user, router, setData]);
  useEffect(() => {
    if (searchParams.has("jwt")) setJwt(searchParams.get("jwt")!).then(onLogin);
  }, [searchParams]);
  // Covers both a fresh form login and arriving here while already logged in.
  useEffect(() => {
    if (user && !searchParams.has("jwt")) onLogin();
  }, [user]);

  function onLogin() {
    setDisabled(true);
    router.push(safeRedirect(searchParams.get("redirect")) ?? Links.Intern);
  }

  function login(event: FormEvent) {
    event.preventDefault();
    if (buttonDisabled) return;
    setLoading(true);
    setError(null);
    _login(data).catch((e) => {
      setError(
        e instanceof InvalidCredentialsError
          ? "Benutzername oder Passwort ist falsch."
          : "Die Anmeldung ist gerade nicht möglich. Bitte versuchen Sie es später erneut.",
      );
      setPartialData({ password: "" });
      setLoading(false);
    });
  }

  async function loginWithPasskey() {
    setLoading(true);
    setError(null);
    try {
      const optionsJSON = await startPasskeyLogin();
      const response = await startAuthentication({ optionsJSON });
      const jwt = await finishPasskeyLogin(response);
      if (!jwt) throw new Error("unknown passkey");
      await setJwt(jwt);
      onLogin();
    } catch (err) {
      // Closing the browser dialog is not an error worth showing.
      if (!(err instanceof Error && err.name === "NotAllowedError"))
        setError("Die Anmeldung mit Passkey hat nicht geklappt.");
      setLoading(false);
    }
  }

  const buttonDisabled =
    data.username.length === 0 || data.password.length === 0;

  return (
    <form
      onSubmit={login}
      className={`${loading || disabled ? "pointer-events-none select-none" : ""} flex flex-col gap-4`}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-username">Benutzername</Label>
        <Input
          id="login-username"
          className="h-10 bg-white"
          name="username"
          autoComplete="username"
          autoFocus
          value={data.username}
          disabled={loading}
          onChange={(event) =>
            setData({ ...data, username: (event as any).target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="login-password">Passwort</Label>
          <Link
            href={Links.PasswortVergessen}
            className="text-emmaus text-sm underline-offset-2 hover:underline"
          >
            Passwort vergessen?
          </Link>
        </div>
        <Input
          id="login-password"
          className="h-10 bg-white"
          type="password"
          name="password"
          autoComplete="current-password"
          value={data.password}
          disabled={loading}
          onChange={(event) =>
            setData({ ...data, password: (event as any).target.value })
          }
        />
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={buttonDisabled}
        className="mt-1 w-full"
        loading={loading ? loading : undefined}
      >
        Anmelden
      </Button>
      <div className="flex items-center gap-3 text-sm text-black/40">
        <span className="h-px grow bg-black/10" />
        oder
        <span className="h-px grow bg-black/10" />
      </div>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="w-full"
        onClick={loginWithPasskey}
      >
        Mit Passkey anmelden
      </Button>
    </form>
  );
}
