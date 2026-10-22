"use client";

import { EventsFlowProvider } from "@/app/monatsblatt/EventsFlow";
import { PosterSheet } from "@/app/monatsblatt/PosterSheet";
import { PosterEditorTile } from "@/app/monatsblatt/editor/PosterEditorTile";
import {
  monthlyDataOf,
  useMonthlyEditorStore,
} from "@/app/monatsblatt/editor/store";
import {
  POSTER_COLUMN_WIDTH_MM,
  POSTER_GAP_MM,
  POSTER_PANELS,
  posterEventsSlotIds,
  posterHiddenTiles,
  tileLabel,
} from "@/app/monatsblatt/poster";
import { EndDropZone } from "@/app/monatsblatt/editor/tile-dnd";
import { AppSegmented } from "@/components/intern/AppUI";
import { LayoutSection } from "@/app/monatsblatt/editor/LayoutSection";
import { POSTER_TEXT_STEPS } from "@/app/monatsblatt/typography";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PiEye, PiEyeSlash } from "react-icons/pi";

/**
 * Arrangement view for the A3 poster (app/monatsblatt/poster.ts): the same
 * tiles as the flyer, distributed over two columns. Content is deliberately
 * read-only here — tiles can only be dragged within/between columns, or
 * dropped from the poster (and brought back via the "Ausgeblendet" menu).
 *
 * The events list is not a tile here: both columns carry a static frame of the
 * events flow, so it always fills whatever space the tiles leave.
 */
export function PosterEditor(props: { liturgies: Liturgy[] }) {
  const store = useMonthlyEditorStore();
  const data = monthlyDataOf(store);
  const hidden = posterHiddenTiles(store.tiles);

  return (
    <LayoutSection
      hint="Plakat · A3 einseitig, zum Aushängen"
      actions={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={hidden.length === 0}
              render={<Button variant="ghost" size="sm" />}
            >
              <PiEyeSlash /> Ausgeblendet ({hidden.length})
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Wieder am Plakat zeigen</DropdownMenuLabel>
                {hidden.map((tile) => (
                  <DropdownMenuItem
                    key={tile.id}
                    onClick={() => store.setPosterVisible(tile.id, true)}
                  >
                    <PiEye /> {tileLabel(tile)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Type scale: the poster's main knob for fitting an issue on the
              page. The events flow re-measures on change (provider keyed). */}
          <div className="flex items-center gap-2">
            <span className="text-black/50">Schriftgröße</span>
            <AppSegmented
              label="Schriftgröße"
              options={POSTER_TEXT_STEPS.map((step) => ({
                value: step.px,
                label: step.label,
              }))}
              value={store.posterTextPx}
              onChange={store.setPosterTextPx}
            />
          </div>
        </>
      }
    >
      <div
        className="flex text-xs opacity-60"
        style={{ gap: `${POSTER_GAP_MM}mm` }}
      >
        {POSTER_PANELS.map((column) => (
          <div
            key={column.id}
            className="text-center"
            style={{ width: `${POSTER_COLUMN_WIDTH_MM}mm` }}
          >
            {column.label}
          </div>
        ))}
      </div>

      <EventsFlowProvider
        // A different type scale is a different layout: remount so the flow
        // measures the new metrics instead of keeping the old distribution.
        key={store.posterTextPx}
        events={store.events}
        liturgies={props.liturgies}
        slotIds={posterEventsSlotIds()}
        layoutKey={JSON.stringify(store.tiles)}
      >
        <div className="rounded-md border border-neutral-200 shadow-sm">
          <PosterSheet
            data={data}
            liturgies={props.liturgies}
            clip={false}
            showEventsOverflowWarning
            bodyPx={store.posterTextPx}
            columnExtra={(column) => (
              <EndDropZone
                onDrop={(draggedId) =>
                  store.reorderPoster(draggedId, column, 1000)
                }
              />
            )}
            renderTile={(tile) => (
              <PosterEditorTile
                key={tile.id}
                item={tile}
                liturgies={props.liturgies}
              />
            )}
          />
        </div>
      </EventsFlowProvider>
    </LayoutSection>
  );
}
