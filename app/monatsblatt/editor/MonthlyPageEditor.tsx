"use client";

import { EventsFlowProvider } from "@/app/monatsblatt/EventsFlow";
import { LetterFlowProvider } from "@/app/monatsblatt/LetterFlow";
import { letterSlotIds } from "@/app/monatsblatt/letter";
import {
  eventsSlotIds,
  FlyerPanel,
  FlyerSheet,
} from "@/app/monatsblatt/FlyerSheet";
import { INSERT_PANEL_PADDING } from "@/app/monatsblatt/InsertSheet";
import { renderEditableEventDescription } from "@/app/monatsblatt/editor/EditableEventDescription";
import { EditorTile } from "@/app/monatsblatt/editor/EditorTile";
import { AppShell, AppTabs } from "@/components/intern/AppShell";
import { EndDropZone } from "@/app/monatsblatt/editor/tile-dnd";
import { IssueMenu } from "@/app/monatsblatt/editor/IssueMenu";
import { LayoutSection } from "@/app/monatsblatt/editor/LayoutSection";
import { PosterEditor } from "@/app/monatsblatt/editor/PosterEditor";
import {
  PublicationStatus,
  PublishMenu,
  usePublication,
} from "@/app/monatsblatt/editor/PublishMenu";
import {
  MonthlyTile,
  monthlyDataOf,
  useMonthlyEditorHistory,
  useMonthlyEditorStore,
} from "@/app/monatsblatt/editor/store";
import {
  INSERT_PANELS,
  isInsertPanel,
  PanelId,
  panelById,
  PANELS,
  SHEET_HEIGHT_MM,
  SHEETS,
} from "@/app/monatsblatt/fold";
import { FLYER_TEXT } from "@/app/monatsblatt/typography";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { cn } from "@/util/utils";
import { useEffect, useState } from "react";
import { PiArrowCounterClockwise, PiPlus } from "react-icons/pi";

function UndoButton() {
  const history = useMonthlyEditorHistory();

  // Text fields keep their native undo; everywhere else Ctrl+Z undoes the
  // last change to the issue.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "z" ||
        !(event.metaKey || event.ctrlKey) ||
        event.shiftKey
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      event.preventDefault();
      useMonthlyEditorHistory.getState().undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={history.past.length === 0}
      title="Rückgängig (Strg+Z)"
      aria-label="Rückgängig"
      onClick={history.undo}
    >
      <PiArrowCounterClockwise />
    </Button>
  );
}

/**
 * Single "add tile" button per panel; the tile type is picked from a
 * popover (a button row per type would overflow the 100 mm panel width).
 */
function AddTileButton(props: {
  panelId: PanelId;
  onInsert: (focusTileId: string | null) => void;
}) {
  const store = useMonthlyEditorStore();
  const [open, setOpen] = useState(false);
  const options: {
    label: string;
    title: string;
    insert: () => string | null;
  }[] = [
    {
      label: "Ankündigung",
      title: "Freier Artikel mit Icon, Titel und Text",
      insert: () => store.insertArticle(props.panelId),
    },
    // A loose Einlage can fall out, so the events list never continues there.
    ...(isInsertPanel(props.panelId)
      ? []
      : [
          {
            label: "Termine",
            title: "Fortsetzung der Terminliste auf diesem Panel",
            insert: () => store.insertEventsSlot(props.panelId),
          },
        ]),
    {
      label: "Wort des Pfarrers",
      title:
        "Brief des Pfarrers; weitere Rahmen setzen den Text auf anderen Panels fort",
      insert: () => store.insertLetterSlot(props.panelId),
    },
    {
      label: "Evangelien",
      title: "Evangelien-Verse der Sonn- und Festtage",
      insert: () => store.insertEvangelien(props.panelId),
    },
    {
      label: "Gebetsanliegen",
      title: "Gebetsanliegen des Papstes für den Monat",
      insert: () => store.insertPapalIntention(props.panelId),
    },
    {
      label: "Instagram",
      title: "Folgen Sie uns auf Instagram – Grafikkachel",
      insert: () => store.insertInstagram(props.panelId),
    },
    {
      label: "Messintentionen",
      title:
        "Vorbefüllte Ankündigung: Was sind Messintentionen, Kosten, Kontakt",
      insert: () => store.insertMessintentionen(props.panelId),
    },
    {
      label: "Kreuzworträtsel",
      title: "Rätselgitter aus eigenen Wörtern und Hinweisen",
      insert: () => store.insertCrossword(props.panelId),
    },
    {
      label: "Bild",
      title: "Bild ohne Überschrift, Höhe einstellbar",
      insert: () => store.insertImage(props.panelId),
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-black/20 p-1 text-xs hover:bg-black/5">
          <PiPlus /> Kachel hinzufügen
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex w-48 flex-col gap-0.5 p-1">
        {options.map((option) => (
          <button
            key={option.label}
            className="rounded-sm px-2 py-1.5 text-left text-sm hover:bg-black/5"
            title={option.title}
            onClick={() => {
              props.onInsert(option.insert());
              setOpen(false);
            }}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default function MonthlyPageEditor(props: { liturgies: Liturgy[] }) {
  const store = useMonthlyEditorStore();
  const normalizeTilePositions = store.normalizeTilePositions;
  const [focusedTileID, setFocusedTileID] = useState<null | string>(null);
  const [view, setView] = useState<"flyer" | "poster">("flyer");
  const publication = usePublication();
  useEffect(() => normalizeTilePositions(), [normalizeTilePositions]);
  const { ensurePapalIntention } = store;
  useEffect(() => {
    ensurePapalIntention();
  }, [ensurePapalIntention, store.month]);

  const data = monthlyDataOf(store);
  const insertHasTiles = store.tiles.some((tile) =>
    isInsertPanel(tile.position.panel),
  );

  const renderTile = (tile: MonthlyTile) => (
    <EditorTile
      key={tile.id}
      item={tile}
      liturgies={props.liturgies}
      focused={focusedTileID === tile.id}
      focusAction={() => setFocusedTileID(tile.id)}
      unfocusAction={() => setFocusedTileID(null)}
    />
  );

  const panelExtra = (panelId: PanelId) =>
    panelId === 0 ? null : (
      <div className="w-44 bg-white opacity-0 transition-opacity group-hover/panel:opacity-90 in-data-[tile-dragging]:opacity-100 [&:has([data-state=open])]:opacity-100">
        <div className="in-data-[tile-dragging]:hidden">
          <AddTileButton
            panelId={panelId}
            onInsert={(focusTileId) => {
              if (focusTileId) setFocusedTileID(focusTileId);
            }}
          />
        </div>
        <EndDropZone
          onDrop={(draggedId) => store.reorder(draggedId, panelId, 1000)}
        />
      </div>
    );

  return (
    <AppShell
      title="Monatsblatt"
      menu={
        <div className="flex items-center gap-1">
          <IssueMenu>
            <PublishMenu publication={publication} />
          </IssueMenu>
          <UndoButton />
        </div>
      }
      center={
        <AppTabs
          label="Layout"
          tabs={
            [
              ["flyer", "Flyer"],
              ["poster", "Plakat"],
            ] as const
          }
          value={view}
          onChange={(id) => {
            setFocusedTileID(null);
            setView(id);
          }}
        />
      }
      actions={<PublicationStatus publication={publication} />}
    >
      {/* Only the active layout is mounted: a hidden (display:none) one
            would measure zero heights in its events flow. */}
      {view === "flyer" ? (
        <LayoutSection
          hint={
            store.hasInsert
              ? "Flyer · 2× A4 quer, Wickelfalz · Einlage 3× pro A4"
              : "Flyer · 2× A4 quer, Wickelfalz"
          }
          actions={
            <label
              className="flex items-center gap-2"
              title={
                store.hasInsert && insertHasTiles
                  ? "Zum Ausschalten zuerst alle Kacheln von der Einlage entfernen oder verschieben"
                  : "Loses Blatt mit zwei weiteren Panels, das in den Flyer gelegt wird"
              }
            >
              <span className="text-black/50">Einlage</span>
              <Switch
                checked={!!store.hasInsert}
                disabled={!!store.hasInsert && insertHasTiles}
                onCheckedChange={store.setHasInsert}
              />
            </label>
          }
        >
          <LetterFlowProvider
            letter={store.letter}
            slotIds={letterSlotIds(store.tiles)}
            layoutKey={JSON.stringify(store.tiles)}
          >
            <EventsFlowProvider
              events={store.events}
              liturgies={props.liturgies}
              slotIds={eventsSlotIds(store.tiles)}
              layoutKey={JSON.stringify(store.tiles)}
              renderDescription={renderEditableEventDescription}
            >
              <div className="flex flex-col items-center gap-10">
                {SHEETS.map((sheet) => (
                  <div key={sheet.label}>
                    <div className="mb-1 flex text-xs opacity-60">
                      {sheet.panels.map((panelId) => {
                        const panel = PANELS.find((p) => p.id === panelId)!;
                        return (
                          <div
                            key={panelId}
                            className="text-center"
                            style={{ width: `${panel.widthMm}mm` }}
                          >
                            {panel.label} ({panel.widthMm} mm)
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-md border border-neutral-200 shadow-sm">
                      <FlyerSheet
                        sheet={sheet}
                        data={data}
                        liturgies={props.liturgies}
                        showFoldMarks
                        clip={false}
                        coverTextSlot={
                          // Same type and alignment as the printed line, so the
                          // preview stays honest while typing.
                          <textarea
                            className={cn(
                              FLYER_TEXT.title,
                              "text-emmaus w-full resize-none bg-transparent text-center leading-tight outline-none placeholder:text-black/20",
                            )}
                            rows={3}
                            placeholder="Covertext … z. B. „Willkommen in der Sommerpause“"
                            value={store.coverText ?? ""}
                            onChange={(e) => store.setCoverText(e.target.value)}
                          />
                        }
                        renderTile={renderTile}
                        panelExtra={panelExtra}
                      />
                    </div>
                  </div>
                ))}
                {store.hasInsert && (
                  <div>
                    <div className="mb-1 text-xs opacity-60">
                      Einlage · 3× pro A4-Bogen gedruckt und geschnitten
                    </div>
                    <div className="flex gap-8">
                      {INSERT_PANELS.map((panelId) => {
                        const panel = panelById(panelId);
                        return (
                          <div key={panelId}>
                            <div className="mb-1 text-center text-xs opacity-60">
                              {panel.label} ({panel.widthMm} mm)
                            </div>
                            <div
                              className={cn(
                                "rounded-md border border-neutral-200 bg-white shadow-sm",
                                FLYER_TEXT.body,
                              )}
                              style={{ height: `${SHEET_HEIGHT_MM}mm` }}
                            >
                              <FlyerPanel
                                panelId={panelId}
                                data={data}
                                liturgies={props.liturgies}
                                padding={INSERT_PANEL_PADDING}
                                clip={false}
                                renderTile={renderTile}
                                panelExtra={panelExtra}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </EventsFlowProvider>
          </LetterFlowProvider>
        </LayoutSection>
      ) : (
        <PosterEditor liturgies={props.liturgies} />
      )}
    </AppShell>
  );
}
