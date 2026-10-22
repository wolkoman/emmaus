"use client";

import { cn } from "@/util/utils";
import { DragEvent, RefObject, useState } from "react";

/**
 * Native drag and drop for Monatsblatt tiles (flyer panels and poster
 * columns). While a drag is running, <body data-tile-dragging> lets drop
 * zones show themselves via the `in-data-[tile-dragging]:` variant.
 */

const TILE_MIME = "application/x-emmaus-tile";

export type DropEdge = "before" | "after";

function endDrag() {
  delete document.body.dataset.tileDragging;
}

export function useTileDrag(
  tileId: string,
  dragImage?: RefObject<HTMLElement | null>,
) {
  const [dragging, setDragging] = useState(false);
  return {
    dragging,
    dragProps: {
      draggable: true,
      onDragStart: (event: DragEvent) => {
        event.stopPropagation();
        event.dataTransfer.setData(TILE_MIME, tileId);
        event.dataTransfer.effectAllowed = "move";
        if (dragImage?.current) {
          event.dataTransfer.setDragImage(dragImage.current, 16, 16);
        }
        document.body.dataset.tileDragging = "";
        // A drop into another panel remounts the tile, so its own dragend
        // never fires — clear the flag from the window instead.
        window.addEventListener("drop", endDrag, { once: true });
        window.addEventListener("dragend", endDrag, { once: true });
        setDragging(true);
      },
      onDragEnd: () => setDragging(false),
    },
  };
}

function isTileDrag(event: DragEvent): boolean {
  return event.dataTransfer.types.includes(TILE_MIME);
}

function edgeOf(event: DragEvent): DropEdge {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
}

/** Drop target on a tile: inserts the dragged tile above or below it. */
export function useTileDrop(
  selfId: string,
  onDrop: (draggedId: string, edge: DropEdge) => void,
) {
  const [edge, setEdge] = useState<DropEdge | null>(null);
  return {
    edge,
    dropProps: {
      onDragOver: (event: DragEvent) => {
        if (!isTileDrag(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setEdge(edgeOf(event));
      },
      onDragLeave: (event: DragEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setEdge(null);
        }
      },
      onDrop: (event: DragEvent) => {
        setEdge(null);
        const draggedId = event.dataTransfer.getData(TILE_MIME);
        if (!draggedId) return;
        event.preventDefault();
        if (draggedId !== selfId) onDrop(draggedId, edgeOf(event));
      },
    },
  };
}

/** Insertion line shown on the tile under the pointer. */
export function DropIndicator(props: { edge: DropEdge | null }) {
  if (!props.edge) return null;
  return (
    <div
      className={cn(
        "bg-emmaus pointer-events-none absolute inset-x-0 z-40 h-0.5 rounded-full",
        props.edge === "before" ? "-top-1.5" : "-bottom-1.5",
      )}
    />
  );
}

/** "Move to the end of this panel/column" target, visible only while dragging. */
export function EndDropZone(props: { onDrop: (draggedId: string) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={cn(
        "hidden items-center justify-center rounded-md border border-dashed bg-white px-3 py-1 text-xs whitespace-nowrap in-data-[tile-dragging]:flex",
        over ? "border-emmaus text-emmaus" : "border-black/30 text-black/60",
      )}
      onDragOver={(event) => {
        if (!isTileDrag(event)) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        setOver(false);
        const draggedId = event.dataTransfer.getData(TILE_MIME);
        if (!draggedId) return;
        event.preventDefault();
        props.onDrop(draggedId);
      }}
    >
      Ans Ende verschieben
    </div>
  );
}

/** Position for inserting next to `targetId` in `list` once `draggedId` is out. */
export function insertionIndex(
  list: { id: string }[],
  draggedId: string,
  targetId: string,
  edge: DropEdge,
): number {
  const others = list.filter((tile) => tile.id !== draggedId);
  return (
    others.findIndex((tile) => tile.id === targetId) +
    (edge === "after" ? 1 : 0)
  );
}
