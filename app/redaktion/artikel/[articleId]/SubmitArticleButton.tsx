"use client";

import { Button } from "@/components/ui/button";
import { CpPaperArticlesStatus } from "@/util/cockpit.generated";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveEditorStatus } from "./saveEditorStatus";

/** Author's last step: marks the article as written. */
export function SubmitArticleButton(props: {
  articleId: string;
  /** Characters missing to the minimum, for a gentle warning. */
  missing?: number;
  /** Editor preview of the author view: never submits. */
  preview?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");

  async function submit() {
    setState("sending");
    try {
      await saveEditorStatus(props.articleId, CpPaperArticlesStatus.Written);
      // The page then shows the thank-you state from the server.
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!!props.missing && props.missing > 0 && (
        <p className="text-sm text-amber-700">
          Ihr Text ist noch {props.missing.toLocaleString("de-AT")} Zeichen zu
          kurz. Sie können trotzdem einreichen.
        </p>
      )}
      <Button
        size="lg"
        className="self-start"
        disabled={props.preview || state === "sending"}
        loading={state === "sending" || undefined}
        onClick={submit}
      >
        Artikel einreichen
      </Button>
      {props.preview && (
        <p className="text-sm text-black/50">
          In der Vorschau deaktiviert, damit nichts versehentlich eingereicht
          wird.
        </p>
      )}
      {state === "error" && (
        <p className="text-sm text-red-700">
          Das Einreichen hat nicht geklappt, bitte erneut versuchen.
        </p>
      )}
    </div>
  );
}
