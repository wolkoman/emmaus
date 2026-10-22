import { EdgeMarks, FlyerPanel } from "@/app/monatsblatt/FlyerSheet";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import {
  INSERT_COPIES,
  INSERT_OFFCUT_MM,
  insertCutOffsetsMm,
  PanelId,
  SHEET_HEIGHT_MM,
  SHEET_WIDTH_MM,
} from "@/app/monatsblatt/fold";
import { FLYER_TEXT } from "@/app/monatsblatt/typography";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { cn } from "@/util/utils";

/**
 * Safe area of an Einlage panel: 8 mm to the paper edge like the flyer, 6 mm
 * to each cut so an imprecise cut never touches the content.
 */
export const INSERT_PANEL_PADDING = "8mm 6mm";

/**
 * One side of the Einlage sheet (297×210 mm): the same Einlage panel
 * INSERT_COPIES times side by side, with cut marks on the copies' edges
 * (see fold.ts).
 */
export function InsertSheet(props: {
  panelId: PanelId;
  data: MonthlyData;
  liturgies: Liturgy[];
}) {
  return (
    <div
      className={cn("relative flex bg-white", FLYER_TEXT.body)}
      style={{
        width: `${SHEET_WIDTH_MM}mm`,
        height: `${SHEET_HEIGHT_MM}mm`,
        paddingLeft: `${INSERT_OFFCUT_MM}mm`,
      }}
    >
      {Array.from({ length: INSERT_COPIES }, (_, copy) => (
        <FlyerPanel
          key={copy}
          panelId={props.panelId}
          data={props.data}
          liturgies={props.liturgies}
          padding={INSERT_PANEL_PADDING}
          clip
        />
      ))}
      <EdgeMarks offsetsMm={insertCutOffsetsMm()} />
    </div>
  );
}
