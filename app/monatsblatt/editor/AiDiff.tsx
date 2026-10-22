"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/util/utils";
import { PiCheck, PiX } from "react-icons/pi";

/**
 * Review step for AI edits: a word-level diff of the editor HTML, to accept
 * or reject before anything reaches the issue. Tokens carry their bold/italic
 * state, so a newly bolded phrase shows as changed too; paragraph changes are
 * marked with ¶.
 */

type Style = { bold: boolean; italic: boolean };
type Token = Style & { text: string };
type Segment = Token & { kind: "same" | "add" | "del" };

const PARAGRAPH = "\n";

function styleOf(node: Node, root: Element): Style {
  const style = { bold: false, italic: false };
  for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
    if (/^(STRONG|B)$/.test(el.tagName)) style.bold = true;
    if (/^(EM|I)$/.test(el.tagName)) style.italic = true;
  }
  return style;
}

/** Words, whitespace runs and paragraph breaks, each with its style. */
function tokens(html: string): Token[] {
  const body = new DOMParser().parseFromString(html, "text/html").body;
  const blocks = body.children.length ? Array.from(body.children) : [body];
  const result: Token[] = [];
  for (const block of blocks) {
    const start = result.length;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const style = styleOf(node, body);
      for (const text of (node.textContent ?? "").split(/(\s+)/)) {
        if (text) result.push({ text, ...style });
      }
    }
    if (result.length > start) {
      result.push({ text: PARAGRAPH, bold: false, italic: false });
    }
  }
  if (result.at(-1)?.text === PARAGRAPH) result.pop();
  return result;
}

const same = (a: Token, b: Token) =>
  a.text === b.text && a.bold === b.bold && a.italic === b.italic;

/** Longest-common-subsequence diff; texts here are a few thousand tokens. */
function diff(before: Token[], after: Token[]): Segment[] {
  const n = before.length;
  const m = after.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = same(before[i], after[j])
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const segments: Segment[] = [];
  const push = (kind: Segment["kind"], token: Token) => {
    const last = segments.at(-1);
    if (
      last?.kind === kind &&
      last.bold === token.bold &&
      last.italic === token.italic
    ) {
      last.text += token.text;
    } else {
      segments.push({ kind, ...token });
    }
  };
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && same(before[i], after[j])) {
      push("same", before[i]);
      i++;
      j++;
    } else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      push("add", after[j++]);
    } else {
      push("del", before[i++]);
    }
  }
  return segments;
}

export function AiDiffView(props: { before: string; after: string }) {
  const segments = diff(tokens(props.before), tokens(props.after));
  const changed = segments.some((segment) => segment.kind !== "same");
  if (!changed) {
    return (
      <div className="rounded-md bg-black/5 px-3 py-2 text-sm">
        Keine Änderungen.
      </div>
    );
  }
  return (
    <div className="max-h-[50vh] overflow-y-auto rounded-md border p-3 text-sm leading-relaxed whitespace-pre-wrap">
      {segments.map((segment, i) => (
        <span
          key={i}
          className={cn(
            segment.bold && "font-semibold",
            segment.italic && "italic",
            segment.kind === "add" && "bg-green-100 text-green-900",
            segment.kind === "del" && "bg-red-100 text-red-800 line-through",
          )}
        >
          {segment.kind === "same"
            ? segment.text
            : // Make added/removed paragraph breaks visible.
              segment.text.replaceAll(PARAGRAPH, " ¶" + PARAGRAPH)}
        </span>
      ))}
    </div>
  );
}

export function AiReviewDialog(props: {
  open: boolean;
  title: string;
  before: string;
  after: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => !open && props.onReject()}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>
            Grün ist neu, rot durchgestrichen fällt weg.
          </DialogDescription>
        </DialogHeader>
        <AiDiffView before={props.before} after={props.after} />
        <DialogFooter>
          <Button variant="outline" onClick={props.onReject}>
            <PiX /> Ablehnen
          </Button>
          <Button onClick={props.onAccept}>
            <PiCheck /> Annehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
