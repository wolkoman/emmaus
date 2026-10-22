"use client";

import { generateCrosswordWords } from "@/app/monatsblatt/editor/actions";
import type { CrosswordAnnouncement } from "@/app/monatsblatt/crossword";
import { normalizeCrosswordAnswer } from "@/app/monatsblatt/crossword";
import { CrosswordWord } from "@/app/monatsblatt/editor/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { PiPlus, PiSparkle, PiTrash } from "react-icons/pi";

/**
 * Modal for editing the word/clue list of a CROSSWORD tile. Works on a local
 * draft; the tile is only updated on "Übernehmen" so the grid doesn't
 * re-layout on every keystroke.
 */
export function CrosswordEditor(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  words: CrosswordWord[];
  announcements: CrosswordAnnouncement[];
  onSave: (words: CrosswordWord[]) => void;
}) {
  const [draft, setDraft] = useState<CrosswordWord[]>(props.words);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  // Re-seed the draft each time the dialog opens.
  useEffect(() => {
    if (props.open) {
      setDraft(props.words);
      setGenerationError("");
    }
  }, [props.open, props.words]);

  async function generate() {
    setGenerating(true);
    setGenerationError("");
    try {
      setDraft(
        await generateCrosswordWords({ announcements: props.announcements }),
      );
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Wörter konnten nicht erzeugt werden",
      );
    } finally {
      setGenerating(false);
    }
  }

  const setRow = (index: number, patch: Partial<CrosswordWord>) =>
    setDraft((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kreuzworträtsel bearbeiten</DialogTitle>
          <DialogDescription>
            Wörter und Hinweise. Das Gitter wird automatisch erzeugt — Wörter
            ohne gemeinsame Buchstaben mit den anderen können nicht platziert
            werden.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            loading={generating}
            disabled={props.announcements.length === 0}
            onClick={generate}
          >
            <PiSparkle /> Aus Ankündigungen erzeugen
          </Button>
          {generationError && (
            <div className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
              {generationError}
            </div>
          )}
          {draft.map((word, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className="w-36 rounded-md border p-2 font-mono text-sm uppercase"
                placeholder="WORT"
                value={word.answer}
                onChange={(e) =>
                  setRow(index, {
                    // Grid letters only — no spaces or hyphens.
                    answer: normalizeCrosswordAnswer(e.target.value),
                  })
                }
              />
              <input
                className="grow rounded-md border p-2 text-sm"
                placeholder="Hinweis"
                value={word.clue}
                onChange={(e) => setRow(index, { clue: e.target.value })}
              />
              <button
                className="rounded-md p-2 text-red-600 hover:bg-red-50"
                title="Wort entfernen"
                onClick={() =>
                  setDraft((rows) => rows.filter((_, i) => i !== index))
                }
              >
                <PiTrash />
              </button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setDraft((rows) => [...rows, { answer: "", clue: "" }])
            }
          >
            <PiPlus /> Wort hinzufügen
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              props.onSave(
                draft.filter((w) => w.answer.trim() && w.clue.trim()),
              );
              props.onOpenChange(false);
            }}
          >
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
