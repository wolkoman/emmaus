import { STAFF_LAYOUT, getBottomLineY, type Clef } from "./notation-layout";

export function StaffLines({
  width,
  clef,
  meter,
  label,
}: {
  width: number;
  clef: Clef;
  meter: string;
  label: string;
}) {
  const [topNumber, bottomNumber] = meter.split("/");

  return (
    <>
      <text x={0} y={22} className="fill-gray-900 text-[16px] font-semibold">
        {label}
      </text>
      <text x={26} y={88} className="fill-gray-900 text-[40px]">
        {clef === "treble" ? "𝄞" : "𝄢"}
      </text>
      <text x={56} y={72} className="fill-gray-900 text-[20px] font-semibold">
        {topNumber}
      </text>
      <text x={56} y={96} className="fill-gray-900 text-[20px] font-semibold">
        {bottomNumber}
      </text>
      {Array.from({ length: 5 }).map((_, index) => {
        const y = STAFF_LAYOUT.topLineY + index * STAFF_LAYOUT.lineGap;
        return (
          <line
            key={y}
            x1={STAFF_LAYOUT.leftPad}
            y1={y}
            x2={width - 36}
            y2={y}
            stroke="#1f2937"
            strokeWidth="1.5"
          />
        );
      })}
      <line
        x1={STAFF_LAYOUT.leftPad}
        y1={STAFF_LAYOUT.topLineY - 2}
        x2={STAFF_LAYOUT.leftPad}
        y2={getBottomLineY() + 2}
        stroke="#1f2937"
        strokeWidth="1.5"
      />
    </>
  );
}
