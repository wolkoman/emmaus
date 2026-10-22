"use client";

import { DefaultTile } from "@/app/monatsblatt/FlyerSheet";
import {
  monthlyDataOf,
  MonthlyTile,
  useMonthlyEditorStore,
} from "@/app/monatsblatt/editor/store";
import {
  DropIndicator,
  insertionIndex,
  useTileDrag,
  useTileDrop,
} from "@/app/monatsblatt/editor/tile-dnd";
import { posterColumnTiles, posterPlacement } from "@/app/monatsblatt/poster";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { cn } from "@/util/utils";
import { PiEyeSlash } from "react-icons/pi";

/**
 * Tile in the A3 poster editor. The poster is an arrangement view, not a
 * content editor: text, images and words are only editable in the flyer
 * editor (one source of truth), here you can just drag a tile within or
 * between the two columns, or drop it from the poster. The events list is not
 * a tile on the poster — it flows through the two static frames of PosterSheet.
 *
 * The toolbar appears on hover, so tiles never change size while being worked
 * on and the events flow measures the same layout the print route renders.
 */
export function PosterEditorTile(props: {
  item: MonthlyTile;
  liturgies: Liturgy[];
}) {
  const store = useMonthlyEditorStore();
  const placement = posterPlacement(props.item);
  const { dragging, dragProps } = useTileDrag(props.item.id);
  // Indices within the whole column (hidden tiles included, they hold their
  // slot) — the store's reorderPoster inserts by that index.
  const { edge, dropProps } = useTileDrop(props.item.id, (draggedId, at) =>
    store.reorderPoster(
      draggedId,
      placement.panel,
      insertionIndex(
        posterColumnTiles(store.tiles, placement.panel),
        draggedId,
        props.item.id,
        at,
      ),
    ),
  );

  return (
    <div
      {...dragProps}
      {...dropProps}
      title="Ziehen zum Verschieben"
      className={cn(
        "group/tile relative flex cursor-grab break-inside-avoid flex-col rounded-md active:cursor-grabbing",
        // Outline (not border/ring-offset) so hovering never shifts layout.
        "outline-black/10 hover:outline",
        dragging && "opacity-40",
      )}
    >
      <DropIndicator edge={edge} />
      {/* Hover bridge: the wrapper's bottom padding reaches down to the tile's
          top edge, so the pointer stays inside the group on its way up. */}
      <div className="absolute top-0 right-0 z-30 hidden -translate-y-full pb-1 group-focus-within/tile:block group-hover/tile:block">
        <button
          title="Nicht am Plakat zeigen (bleibt im Flyer)"
          className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs shadow-sm hover:bg-black/5"
          onClick={() => store.setPosterVisible(props.item.id, false)}
        >
          <PiEyeSlash /> Ausblenden
        </button>
      </div>

      <DefaultTile
        tile={props.item}
        data={monthlyDataOf(store)}
        liturgies={props.liturgies}
      />
    </div>
  );
}
