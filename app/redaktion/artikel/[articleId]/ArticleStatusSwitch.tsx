"use client";

import { AppSegmented } from "@/components/intern/AppUI";
import { CpPaperArticlesStatus } from "@/util/cockpit.generated";
import { useState } from "react";
import { PiSpinner } from "react-icons/pi";
import { ARTICLE_STATUSES } from "./articleInfo";
import { saveEditorStatus } from "./saveEditorStatus";

export function ArticleStatusSwitch(props: {
  articleId: string;
  initialStatus: CpPaperArticlesStatus;
}) {
  const [status, setStatus] = useState(
    props.initialStatus || CpPaperArticlesStatus.Writing,
  );
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  async function change(next: CpPaperArticlesStatus) {
    const previous = status;
    setStatus(next);
    setState("saving");
    try {
      await saveEditorStatus(props.articleId, next);
      setState("idle");
    } catch {
      setStatus(previous);
      setState("error");
    }
  }

  return (
    <span className="flex items-center justify-end gap-2">
      {state === "saving" && <PiSpinner className="animate-spin" />}
      {state === "error" && (
        <span className="text-sm font-normal text-red-700">
          nicht gespeichert
        </span>
      )}
      <AppSegmented
        label="Status"
        options={ARTICLE_STATUSES}
        value={status}
        onChange={change}
        disabled={state === "saving"}
      />
    </span>
  );
}
