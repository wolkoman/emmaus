"use client";

import {
  EventsSlot,
  useEventsFlowMeasuring,
} from "@/app/monatsblatt/EventsFlow";
import { tilesForPanel } from "@/app/monatsblatt/FlyerSheet";
import { flyerAnnouncementTiles } from "@/app/monatsblatt/content";
import {
  ArticleView,
  CrosswordView,
  EvangelienView,
  ImageView,
  InstagramView,
  PapalIntentionView,
} from "@/app/monatsblatt/FlyerTiles";
import { CrosswordEditor } from "@/app/monatsblatt/editor/CrosswordEditor";
import { AiReviewDialog } from "@/app/monatsblatt/editor/AiDiff";
import {
  LetterSlot,
  useLetterFlowMeasuring,
} from "@/app/monatsblatt/LetterFlow";
import { LETTER_TITLE, letterSlotIds } from "@/app/monatsblatt/letter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  checkLetterText,
  rewriteArticleBody,
  uploadMonthlyImage,
} from "@/app/monatsblatt/editor/actions";
import { compressImage } from "@/app/upload/compressImage";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconPicker } from "@/app/monatsblatt/editor/IconPicker";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import {
  MonthlyLetter,
  MonthlyTile,
  useMonthlyEditorStore,
} from "@/app/monatsblatt/editor/store";
import { contentPanels, panelById } from "@/app/monatsblatt/fold";
import { FLYER_TEXT } from "@/app/monatsblatt/typography";
import { cn } from "@/util/utils";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type ReactQuillType from "react-quill-new";
import {
  PiCheck,
  PiDotsSixVertical,
  PiImage,
  PiMegaphone,
  PiPencilSimple,
  PiSparkle,
  PiTrash,
} from "react-icons/pi";
import {
  DropIndicator,
  insertionIndex,
  useTileDrag,
  useTileDrop,
} from "@/app/monatsblatt/editor/tile-dnd";
import "./ql.css";

// next/dynamic doesn't forward refs, so wrap react-quill-new and pass the
// ref through a regular prop — we need the Quill instance for the custom
// bold/italic toolbar (see toggleFormat).
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    function QuillWithRef({
      quillRef,
      ...props
    }: React.ComponentProps<typeof RQ> & {
      quillRef: React.Ref<ReactQuillType>;
    }) {
      return <RQ ref={quillRef} {...props} />;
    }
    return QuillWithRef;
  },
  { ssr: false, loading: () => <>…</> },
);

/**
 * Hidden file input + trigger button: compresses the picked image in the
 * browser (reuses the gallery uploader's helper), uploads it via server
 * action, and reports the public URL back.
 */
function ImageUploadButton(props: {
  onUploaded: (url: string) => void;
  children: (openPicker: () => void, uploading: boolean) => React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const form = new FormData();
      form.set("image", compressed);
      props.onUploaded(await uploadMonthlyImage(form));
    } catch (error) {
      console.error(error);
      alert("Bild-Upload fehlgeschlagen – bitte erneut versuchen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {props.children(() => inputRef.current?.click(), uploading)}
    </>
  );
}

/**
 * Toolbar popover: prompt the AI to rewrite an article body. The result is
 * shown as a diff and only replaces the text once accepted.
 */
function AiRewriteButton(props: {
  title: string;
  text: string;
  onResult: (html: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);

  async function run() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const html = await rewriteArticleBody(
        prompt.trim(),
        props.title,
        props.text,
      );
      // Models occasionally wrap the answer in code fences despite the
      // system prompt; strip them before handing the HTML to Quill.
      setProposal(html.replace(/^```(?:html)?\s*/i, "").replace(/```$/, ""));
      setOpen(false);
      setPrompt("");
    } catch {
      setError("Anfrage fehlgeschlagen – bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title="Text mit KI überarbeiten"
          className="p-2 hover:bg-black/5"
        >
          <PiSparkle />
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex w-80 flex-col gap-2 p-3">
        <textarea
          className="h-20 resize-none rounded-md border p-2 text-sm"
          placeholder="z. B. Kürze auf drei Sätze / Formuliere einladender …"
          value={prompt}
          autoFocus
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run();
            }
          }}
        />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <Button loading={loading || undefined} onClick={run}>
          <PiSparkle /> Vorschlag erstellen
        </Button>
      </PopoverContent>
      <AiReviewDialog
        open={proposal !== null}
        title="KI-Vorschlag prüfen"
        before={props.text}
        after={proposal ?? ""}
        onAccept={() => {
          props.onResult(proposal ?? props.text);
          setProposal(null);
        }}
        onReject={() => setProposal(null)}
      />
    </Popover>
  );
}

/**
 * Toggle an inline format via the Quill API. We deliberately do NOT use
 * Quill's toolbar module with an external container: the side-toolbar DOM
 * survives focus cycles, and every new Quill instance would attach an
 * additional click handler to the same buttons — stacked handlers then
 * fight over the toggle (bold applies but never un-applies).
 */
function toggleQuillFormat(
  editor: ReactQuillType | null,
  format: "bold" | "italic",
) {
  const quill = editor?.getEditor();
  if (!quill) return;
  const range = quill.getSelection(true);
  if (!range) return;
  const active = !!quill.getFormat(range)[format];
  quill.format(format, !active, "user");
}

/**
 * Modal for the "Wort des Pfarrers": the text spans several frames, so it is
 * edited here as a whole. Works on a draft like CrosswordEditor; the flow only
 * re-splits on "Übernehmen".
 */
function LetterEditor(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letter: MonthlyLetter;
  onSave: (patch: Pick<MonthlyLetter, "text">) => void;
}) {
  const quillRef = useRef<ReactQuillType | null>(null);
  const [text, setText] = useState(props.letter.text);
  const [check, setCheck] = useState<
    | { phase: "idle" }
    | { phase: "running" }
    | { phase: "review"; html: string }
    | { phase: "error"; message: string }
  >({ phase: "idle" });
  useEffect(() => {
    if (props.open) {
      setText(props.letter.text);
      setCheck({ phase: "idle" });
    }
  }, [props.open, props.letter]);

  async function runCheck() {
    setCheck({ phase: "running" });
    try {
      setCheck({ phase: "review", html: await checkLetterText(text) });
    } catch (error) {
      setCheck({
        phase: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{LETTER_TITLE}</DialogTitle>
          <DialogDescription>
            Der Text läuft durch alle Rahmen „{LETTER_TITLE}“, in der
            Reihenfolge der Panels.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col rounded-md border">
          <div className="flex border-b">
            {/* preventDefault on mousedown keeps the editor selection. */}
            <button
              title="Fett"
              className="w-8 p-2 leading-none font-semibold hover:bg-black/5"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleQuillFormat(quillRef.current, "bold")}
            >
              B
            </button>
            <button
              title="Kursiv"
              className="w-8 p-2 leading-none italic hover:bg-black/5"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleQuillFormat(quillRef.current, "italic")}
            >
              I
            </button>
          </div>
          <ReactQuill
            quillRef={quillRef}
            modules={{ toolbar: false }}
            className="custom-html-weekly p-2 [&_.ql-editor]:min-h-64 [&_p]:my-0! [&_p+p]:mt-[0.6em]!"
            theme="snow"
            value={text}
            onChange={setText}
          />
        </div>
        <AiReviewDialog
          open={check.phase === "review"}
          title="KI-Korrektur prüfen"
          before={text}
          after={check.phase === "review" ? check.html : ""}
          onAccept={() => {
            // Into the draft: "Übernehmen" saves it, "Abbrechen" still drops it.
            if (check.phase === "review") setText(check.html);
            setCheck({ phase: "idle" });
          }}
          onReject={() => setCheck({ phase: "idle" })}
        />
        {check.phase === "error" && (
          <div className="text-xs text-red-600">{check.message}</div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            className="sm:mr-auto"
            loading={check.phase === "running" || undefined}
            disabled={!text.trim()}
            onClick={runCheck}
          >
            <PiSparkle /> KI-Korrektur und Formatierung
          </Button>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              props.onSave({ text });
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

/**
 * Interactive tile for the Monatsblatt editor: click to focus, drag to move
 * (tile-dnd.tsx), toolbar above the tile for format / delete, Quill for text.
 * Same interaction pattern as the weekly TileComponent, but panel-based.
 */
export function EditorTile(props: {
  item: MonthlyTile;
  liturgies: Liturgy[];
  focused: boolean;
  focusAction: () => void;
  unfocusAction: () => void;
}) {
  const store = useMonthlyEditorStore();
  const measuring = useEventsFlowMeasuring();
  const quillRef = useRef<ReactQuillType | null>(null);
  const [crosswordOpen, setCrosswordOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const letterMeasuring = useLetterFlowMeasuring();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { focused, unfocusAction } = props;

  // Escape or a click elsewhere ends editing. Popovers and dialogs opened
  // from the tile are portaled outside it and must not count as "elsewhere".
  useEffect(() => {
    if (!focused) return;
    const layer = "[data-radix-popper-content-wrapper], [role=dialog]";
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element;
      if (rootRef.current?.contains(target) || target.closest(layer)) return;
      unfocusAction();
    }
    function onKeyDown(event: KeyboardEvent) {
      // An open popover/dialog takes this Escape for itself.
      if (event.key === "Escape" && !document.querySelector(layer)) {
        unfocusAction();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [focused, unfocusAction]);

  function patchItem(patch: Partial<MonthlyTile>) {
    store.updateTile(
      props.item.id,
      (item) => ({ ...item, ...patch }) as MonthlyTile,
    );
  }

  function toggleFormat(format: "bold" | "italic") {
    toggleQuillFormat(quillRef.current, format);
  }

  const panels = contentPanels(!!store.hasInsert);
  const panelIndex = panels.indexOf(props.item.position.panel);
  const prevPanel = panels[panelIndex - 1];
  const nextPanel = panels[panelIndex + 1];
  const panelTiles = tilesForPanel(store.tiles, props.item.position.panel);
  const tileIndex = panelTiles.findIndex((tile) => tile.id === props.item.id);
  const { dragging, dragProps } = useTileDrag(props.item.id, rootRef);
  const { edge, dropProps } = useTileDrop(props.item.id, (draggedId, at) =>
    store.reorder(
      draggedId,
      props.item.position.panel,
      insertionIndex(panelTiles, draggedId, props.item.id, at),
    ),
  );

  // Keyboard fallback for dragging: Alt + arrows, outside of text fields.
  useEffect(() => {
    if (!focused) return;
    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      const { id, position } = props.item;
      const moves: Record<string, () => void> = {
        ArrowUp: () =>
          tileIndex > 0 && store.reorder(id, position.panel, tileIndex - 1),
        ArrowDown: () => store.reorder(id, position.panel, tileIndex + 1),
        ArrowLeft: () =>
          prevPanel !== undefined && store.reorder(id, prevPanel, 1000),
        ArrowRight: () =>
          nextPanel !== undefined && store.reorder(id, nextPanel, 0),
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      move();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });
  const announcements = flyerAnnouncementTiles(store.tiles).map((tile) => ({
    title: tile.title,
    html: tile.text,
  }));

  return (
    <div
      ref={rootRef}
      className={cn(
        // transition-shadow only — transition-all would animate flex-grow,
        // which breaks the events-flow measurement (it reads clientHeight in
        // the same frame the grow class is applied).
        "group relative flex break-inside-avoid flex-col rounded-md transition-shadow",
        // EVENTS tiles are flow slots — while the flow measures they must
        // grow to expose the panel's remaining height; afterwards they hug
        // their content.
        props.item.type === "EVENTS" && cn("min-h-0", measuring && "grow"),
        props.item.type === "LETTER" &&
          cn("min-h-0", letterMeasuring && "grow"),
        props.focused &&
          "z-20 -m-2 bg-white p-2 shadow outline outline-black/10",
        dragging && "opacity-40",
      )}
      {...dropProps}
    >
      <DropIndicator edge={edge} />
      {!props.focused && (
        <div
          {...dragProps}
          className="absolute inset-0 z-10 cursor-pointer"
          title="Klicken zum Bearbeiten, ziehen zum Verschieben"
          onClick={props.focusAction}
        />
      )}
      {/* Toolbar floats above the tile (translate-y) so it never affects
          the panel's layout/flow. Grouped: move | format | delete | done. */}
      <div
        className={cn(
          "absolute -top-3 left-0 z-30 flex -translate-y-full items-center overflow-hidden rounded-md border border-neutral-200 bg-white text-sm shadow-sm",
          props.focused ? "" : "hidden",
        )}
      >
        <div
          {...dragProps}
          title="Ziehen zum Verschieben (oder Alt + Pfeiltasten)"
          className="cursor-grab self-stretch px-1.5 py-2 text-black/50 hover:bg-black/5 hover:text-black active:cursor-grabbing"
        >
          <PiDotsSixVertical />
        </div>
        {props.item.type === "IMAGE" && (
          <>
            <div className="h-5 w-px bg-neutral-200" />
            {/* Height cap; the tile hugs the picture below it (ImageView). */}
            <label
              className="flex items-center gap-1.5 px-2 text-xs"
              title="Maximale Höhe des Bildes in Millimetern"
            >
              <input
                type="range"
                min={10}
                max={190}
                step={1}
                className="w-28 accent-neutral-700"
                value={props.item.heightMm}
                onChange={(e) =>
                  patchItem({ heightMm: Number(e.target.value) })
                }
              />
              <span className="w-10 tabular-nums">
                {props.item.heightMm} mm
              </span>
            </label>
            <ImageUploadButton onUploaded={(url) => patchItem({ url })}>
              {(openPicker, uploading) => (
                <button
                  title="Bild hochladen/ersetzen"
                  className="p-2 hover:bg-black/5 disabled:opacity-50"
                  disabled={uploading}
                  onClick={openPicker}
                >
                  <PiImage />
                </button>
              )}
            </ImageUploadButton>
          </>
        )}
        {props.item.type === "CROSSWORD" && (
          <>
            <div className="h-5 w-px bg-neutral-200" />
            <button
              title="Wörter und Hinweise bearbeiten"
              className="p-2 hover:bg-black/5"
              onClick={() => setCrosswordOpen(true)}
            >
              <PiPencilSimple />
            </button>
          </>
        )}
        {props.item.type === "LETTER" && (
          <>
            <div className="h-5 w-px bg-neutral-200" />
            <button
              title="Text bearbeiten"
              className="p-2 hover:bg-black/5"
              onClick={() => setLetterOpen(true)}
            >
              <PiPencilSimple />
            </button>
          </>
        )}
        {props.item.type === "ARTICLE" && (
          <>
            <div className="h-5 w-px bg-neutral-200" />
            <button
              title={
                props.item.type === "ARTICLE" && props.item.announceAfterMass
                  ? "Nicht nach der Messe verlautbaren"
                  : "Nach der Messe verlautbaren"
              }
              aria-pressed={
                props.item.type === "ARTICLE" && !!props.item.announceAfterMass
              }
              className={cn(
                "p-2 hover:bg-black/5",
                props.item.type === "ARTICLE" &&
                  props.item.announceAfterMass &&
                  "bg-emmaus hover:bg-emmaus/90 text-white",
              )}
              onClick={() =>
                patchItem({
                  announceAfterMass:
                    props.item.type === "ARTICLE"
                      ? !props.item.announceAfterMass
                      : false,
                })
              }
            >
              <PiMegaphone />
            </button>
            <div className="h-5 w-px bg-neutral-200" />
            {/* preventDefault on mousedown keeps the editor selection. */}
            <button
              title="Fett"
              className="w-8 p-2 leading-none font-semibold hover:bg-black/5"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleFormat("bold")}
            >
              B
            </button>
            <button
              title="Kursiv"
              className="w-8 p-2 leading-none italic hover:bg-black/5"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleFormat("italic")}
            >
              I
            </button>
            <div className="h-5 w-px bg-neutral-200" />
            <AiRewriteButton
              title={props.item.type === "ARTICLE" ? props.item.title : ""}
              text={props.item.type === "ARTICLE" ? props.item.text : ""}
              onResult={(html) => patchItem({ text: html })}
            />
          </>
        )}
        <div className="h-5 w-px bg-neutral-200" />
        <button
          title="Löschen"
          className="p-2 text-red-600 hover:bg-red-50"
          onClick={() => store.removeTile(props.item.id)}
        >
          <PiTrash />
        </button>
        <div className="h-5 w-px bg-neutral-200" />
        <button
          title="Bearbeitung beenden"
          className="flex items-center gap-1 self-stretch bg-neutral-900 px-3 text-xs text-white hover:bg-neutral-700"
          onClick={props.unfocusAction}
        >
          <PiCheck /> Fertig
        </button>
      </div>

      {props.item.type === "ARTICLE" &&
        (props.focused ? (
          // Focused: editable variant (icon picker + title input + Quill).
          // gap-2 matches ArticleView so focusing doesn't shift the layout.
          <div className="flex grow flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <IconPicker
                value={
                  props.item.type === "ARTICLE" ? props.item.icon : undefined
                }
                onChange={(icon) => patchItem({ icon })}
              />
              <input
                className={cn(
                  "w-full bg-transparent tracking-wide uppercase outline-none",
                  FLYER_TEXT.heading,
                )}
                value={props.item.type === "ARTICLE" ? props.item.title : ""}
                onChange={(e) => patchItem({ title: e.target.value })}
              />
            </div>
            <ReactQuill
              quillRef={quillRef}
              modules={{ toolbar: false }}
              className="custom-html-weekly [&_p]:my-0!"
              theme="snow"
              value={props.item.type === "ARTICLE" ? props.item.text : ""}
              onChange={(val) => patchItem({ text: val })}
            />
          </div>
        ) : (
          // Unfocused: exactly the print rendering (WYSIWYG, one source).
          <ArticleView
            title={props.item.title}
            text={props.item.text}
            icon={props.item.icon}
          />
        ))}
      {props.item.type === "EVENTS" && (
        <EventsSlot
          id={props.item.id}
          showOverflowWarning
          emptyState={
            <div className="flex min-h-8 items-center justify-center rounded-md border border-dashed border-black/20 px-2 text-xs text-black/50">
              Leerer Terminblock
            </div>
          }
        />
      )}
      {props.item.type === "LETTER" && (
        <>
          <LetterSlot
            id={props.item.id}
            letter={store.letter}
            isFirst={letterSlotIds(store.tiles)[0] === props.item.id}
            showOverflowWarning
            emptyState={
              <div className="flex min-h-8 items-center justify-center rounded-md border border-dashed border-black/20 px-2 text-xs text-black/50">
                {store.letter?.text
                  ? "Leerer Rahmen (Text ist schon untergebracht)"
                  : "Noch kein Text – Stift-Symbol zum Schreiben"}
              </div>
            }
          />
          <LetterEditor
            open={letterOpen}
            onOpenChange={setLetterOpen}
            letter={store.letter ?? { text: "" }}
            onSave={store.setLetter}
          />
        </>
      )}
      {props.item.type === "EVANGELIEN" && (
        <EvangelienView events={store.events} liturgies={props.liturgies} />
      )}
      {props.item.type === "GEBETSANLIEGEN" && (
        <PapalIntentionView
          intention={store.papalIntention}
          month={store.name}
        />
      )}
      {props.item.type === "INSTAGRAM" && <InstagramView />}
      {props.item.type === "IMAGE" &&
        (props.item.url ? (
          <ImageView url={props.item.url} heightMm={props.item.heightMm} />
        ) : (
          // Editor-only placeholder; print renders nothing for empty tiles.
          <ImageUploadButton onUploaded={(url) => patchItem({ url })}>
            {(openPicker, uploading) => (
              <button
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-black/20 text-xs hover:bg-black/5"
                style={{
                  height: `${(props.item as { heightMm: number }).heightMm}mm`,
                }}
                disabled={uploading}
                onClick={openPicker}
              >
                <PiImage />{" "}
                {uploading ? "Wird hochgeladen …" : "Bild hochladen"}
              </button>
            )}
          </ImageUploadButton>
        ))}
      {props.item.type === "CROSSWORD" && (
        <>
          <CrosswordView words={props.item.words} showUnplacedWarning />
          <CrosswordEditor
            open={crosswordOpen}
            onOpenChange={setCrosswordOpen}
            words={props.item.words}
            announcements={announcements}
            onSave={(words) => patchItem({ words })}
          />
        </>
      )}
    </div>
  );
}
