"use client";

import { Links } from "@/app/(shared)/Links";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PiCheck, PiCopy } from "react-icons/pi";

/** Copies the author link of an article; icon-only without `label`. */
export function CopyArticleLinkButton(props: {
  articleId: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}${Links.ProjektplattformArtikel(
      props.articleId,
    )}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (e.g. insecure context); ignore silently.
    }
  }

  const icon = copied ? <PiCheck className="text-green-600" /> : <PiCopy />;
  return props.label ? (
    <Button variant="outline" onClick={copyLink}>
      {icon} {copied ? "Kopiert" : props.label}
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="icon-sm"
      title="Link kopieren"
      aria-label="Link kopieren"
      onClick={copyLink}
    >
      {icon}
    </Button>
  );
}
