import { DefaultTile } from "@/app/monatsblatt/FlyerSheet";
import { screenTiles } from "@/app/monatsblatt/content";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import { Liturgy } from "@/domain/liturgy/liturgy-data";

/**
 * Web view of a published issue (see app/monatsblatt/page.tsx) — the same
 * content as the printed products, reflowed for the screen.
 *
 * The tile renderers are reused as-is; only the frame differs:
 *  - Which tiles and in which order is decided by `screenTiles`
 *    (app/monatsblatt/content.ts), shared with the newsletter.
 *  - No base font size is set: the tiles size everything relative to the root
 *    (see typography.ts), so on the web they simply inherit the site's type.
 */

export function MonthlyWebView(props: {
  data: MonthlyData;
  liturgies: Liturgy[];
}) {
  const tiles = screenTiles(props.data.tiles);

  return (
    <div className="gap-8 lg:columns-2">
      {tiles.map((tile) => (
        <div key={tile.id} className="mb-8 break-inside-avoid">
          <DefaultTile
            tile={tile}
            data={props.data}
            liturgies={props.liturgies}
          />
        </div>
      ))}
    </div>
  );
}
