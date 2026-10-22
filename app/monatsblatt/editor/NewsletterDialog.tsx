"use client";

import {
  monthlyNewsletterStatus,
  previewMonthlyNewsletter,
  sendMonthlyNewsletter,
  sendMonthlyNewsletterTest,
} from "@/app/monatsblatt/editor/mail/monatsmitteilungen";
import { useUserStore } from "@/store/UserStore";
import { useMonthlyEditorStore } from "@/app/monatsblatt/editor/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { PiCheck, PiEye, PiMailbox, PiWarning } from "react-icons/pi";
import { RiLoader4Fill } from "react-icons/ri";

/**
 * "Newsletter" — mails the published issue to the newsletter recipients
 * (see editor/mail/monatsmitteilungen.ts).
 *
 * Two steps on purpose: opening the
 * dialog only loads the status (recipient count, whether it already went
 * out); the preview renders the very mail without sending; and only "Jetzt
 * versenden" inside the dialog dispatches. There is no undo for a mail to
 * several hundred people.
 */
export function NewsletterDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useMonthlyEditorStore();
  const person = useUserStore((state) => state.person);
  const [testMail, setTestMail] = useState("");
  const [testState, setTestState] = useState("");
  const [status, setStatus] = useState<
    | { phase: "loading" }
    | {
        phase: "ready";
        recipients: number;
        sentAt: string;
        published: boolean;
      }
    | { phase: "sending" }
    | { phase: "sent"; sentAt: string }
    | { phase: "error"; message: string }
  >({ phase: "loading" });

  // Default to the editor's own address; they can type any other.
  useEffect(() => {
    if (person?.email) setTestMail((current) => current || person.email);
  }, [person]);

  async function sendTest() {
    setTestState("Testmail wird versendet…");
    try {
      await sendMonthlyNewsletterTest(store.name, testMail);
      setTestState(`Testmail an ${testMail} versendet.`);
    } catch (err) {
      setTestState(err instanceof Error ? err.message : String(err));
    }
  }

  async function load() {
    setStatus({ phase: "loading" });
    try {
      setStatus({
        ...(await monthlyNewsletterStatus(store.name)),
        phase: "ready",
      });
    } catch (err) {
      setStatus({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function preview() {
    try {
      const html = await previewMonthlyNewsletter(store.name);
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      window.open(url, "_blank");
    } catch (err) {
      setStatus({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function send() {
    setStatus({ phase: "sending" });
    try {
      setStatus({
        phase: "sent",
        sentAt: await sendMonthlyNewsletter(store.name),
      });
    } catch (err) {
      setStatus({
        phase: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  useEffect(() => {
    if (props.open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex flex-col gap-3 text-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Newsletter versenden</DialogTitle>
        </DialogHeader>
        {status.phase === "loading" && (
          <div className="flex items-center gap-2 text-gray-600">
            <RiLoader4Fill className="animate-spin" /> Empfänger werden geladen…
          </div>
        )}

        {status.phase === "error" && (
          <div className="flex items-start gap-2 text-red-800">
            <PiWarning className="mt-0.5 shrink-0" /> {status.message}
          </div>
        )}

        {status.phase === "sending" && (
          <div className="flex items-center gap-2 text-gray-600">
            <RiLoader4Fill className="animate-spin" /> Newsletter wird
            versendet…
          </div>
        )}

        {status.phase === "sent" && (
          <div className="flex items-center gap-2">
            <PiCheck className="text-emmaus" /> Versendet am{" "}
            {new Date(status.sentAt).toLocaleString("de-AT")}
          </div>
        )}

        {status.phase === "ready" && (
          <>
            <div className="font-semibold">Monatsmitteilungen {store.name}</div>
            {status.sentAt ? (
              <div className="flex items-center gap-2 text-gray-600">
                <PiCheck className="text-emmaus shrink-0" /> Bereits am{" "}
                {new Date(status.sentAt).toLocaleString("de-AT")} an die
                Newsletter-Empfänger versendet.
              </div>
            ) : (
              <div className="text-gray-600">
                {status.published
                  ? `Geht an ${status.recipients} Empfänger — das lässt sich nicht widerrufen.`
                  : "Diese Ausgabe ist noch nicht veröffentlicht."}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={preview}>
                <PiEye /> Vorschau
              </Button>
              <Button
                size="sm"
                disabled={!status.published || !!status.sentAt}
                onClick={send}
              >
                <PiMailbox /> Jetzt versenden
              </Button>
            </div>

            <div className="flex flex-col gap-1 border-t border-neutral-200 pt-3">
              <label className="text-gray-600">
                Testmail an eine Adresse (gespeicherter Stand)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  className="w-full rounded-md border p-1.5"
                  placeholder="name@example.com"
                  value={testMail}
                  onChange={(event) => {
                    setTestMail(event.target.value);
                    setTestState("");
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!testMail}
                  onClick={sendTest}
                >
                  Senden
                </Button>
              </div>
              {testState && (
                <div className="text-xs text-gray-600">{testState}</div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
