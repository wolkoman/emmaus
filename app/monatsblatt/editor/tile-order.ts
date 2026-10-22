import type { MonthlyTile } from "@/app/monatsblatt/editor/store";
import {
  CONTENT_PANEL_ORDER,
  isInsertPanel,
  type PanelId,
} from "@/app/monatsblatt/fold";

function byOrder(a: MonthlyTile, b: MonthlyTile): number {
  return a.position.order - b.position.order;
}

export function nextTileOrder(tiles: MonthlyTile[], panel: PanelId): number {
  return (
    tiles.reduce(
      (highest, tile) =>
        tile.position.panel === panel
          ? Math.max(highest, tile.position.order)
          : highest,
      -1,
    ) + 1
  );
}

export function normalizeTilePositions(tiles: MonthlyTile[]): MonthlyTile[] {
  const recoveredCoverTiles = tiles
    .filter((tile) => tile.position.panel === 0)
    .sort(byOrder);

  return CONTENT_PANEL_ORDER.flatMap((panel) => {
    const panelTiles = tiles
      .filter((tile) => tile.position.panel === panel)
      .sort(byOrder);
    const normalized =
      panel === CONTENT_PANEL_ORDER[0]
        ? [...panelTiles, ...recoveredCoverTiles]
        : panelTiles;

    return normalized.map((tile, order) => ({
      ...tile,
      position: { panel, order },
    }));
  });
}

export function moveTile(
  tiles: MonthlyTile[],
  tileId: string,
  panel: PanelId,
  order: number,
): MonthlyTile[] {
  if (!CONTENT_PANEL_ORDER.includes(panel)) return tiles;

  const normalized = normalizeTilePositions(tiles);
  const moved = normalized.find((tile) => tile.id === tileId);
  if (!moved) return tiles;
  // The events flow never continues on the Einlage (see eventsSlotIds).
  if (moved.type === "EVENTS" && isInsertPanel(panel)) return tiles;

  const byPanel = new Map<PanelId, MonthlyTile[]>();
  for (const panelId of CONTENT_PANEL_ORDER) {
    byPanel.set(
      panelId,
      normalized.filter(
        (tile) => tile.position.panel === panelId && tile.id !== tileId,
      ),
    );
  }

  const target = byPanel.get(panel)!;
  const targetOrder = Math.max(0, Math.min(order, target.length));
  target.splice(targetOrder, 0, {
    ...moved,
    position: { panel, order: targetOrder },
  });

  return CONTENT_PANEL_ORDER.flatMap((panelId) =>
    byPanel.get(panelId)!.map((tile, tileOrder) => ({
      ...tile,
      position: { panel: panelId, order: tileOrder },
    })),
  );
}
