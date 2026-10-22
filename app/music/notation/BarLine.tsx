import { STAFF_LAYOUT, getBottomLineY } from "./notation-layout";

export function BarLine({ x }: { x: number }) {
  return (
    <line
      x1={x}
      y1={STAFF_LAYOUT.topLineY - 2}
      x2={x}
      y2={getBottomLineY() + 2}
      stroke="#1f2937"
      strokeWidth="1.5"
    />
  );
}
