import type { DurationSymbol } from "../music-format";
import { STAFF_LAYOUT } from "./notation-layout";

export function RestGlyph({
  duration,
  dotted,
  active,
  x,
}: {
  duration: DurationSymbol;
  dotted: boolean;
  active: boolean;
  x: number;
}) {
  const inkColor = active ? "#ea580c" : "#1f2937";

  if (duration === "w") {
    return (
      <>
        {active && (
          <circle
            cx={x}
            cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap + 3}
            r="18"
            fill="#fed7aa"
            opacity="0.7"
          />
        )}
        <rect
          x={x - 12}
          y={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap - 1}
          width="24"
          height="8"
          rx="1.5"
          fill={inkColor}
        />
        {dotted && (
          <circle
            cx={x + 18}
            cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap + 3}
            r="2.8"
            fill={inkColor}
          />
        )}
      </>
    );
  }

  if (duration === "h") {
    return (
      <>
        {active && (
          <circle
            cx={x}
            cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 3}
            r="18"
            fill="#fed7aa"
            opacity="0.7"
          />
        )}
        <rect
          x={x - 12}
          y={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 7}
          width="24"
          height="8"
          rx="1.5"
          fill={inkColor}
        />
        {dotted && (
          <circle
            cx={x + 18}
            cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 3}
            r="2.8"
            fill={inkColor}
          />
        )}
      </>
    );
  }

  if (duration === "q") {
    return (
      <>
        {active && (
          <circle
            cx={x}
            cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 2}
            r="18"
            fill="#fed7aa"
            opacity="0.7"
          />
        )}
        <path
          d={`M ${x + 3} ${STAFF_LAYOUT.topLineY + 8} q -11 10 -4 19 q 8 9 -1 18 q -7 7 -1 14 l -4 10 l 7 0 l 4 -9 q 6 -14 -1 -22 q -6 -7 2 -15 q 7 -9 0 -18 q -7 -8 -2 -16`}
          fill={inkColor}
        />
        {dotted && (
          <circle
            cx={x + 16}
            cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 2}
            r="2.8"
            fill={inkColor}
          />
        )}
      </>
    );
  }

  if (duration === "s") {
    return (
      <>
        {active && (
          <circle
            cx={x}
            cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 2}
            r="18"
            fill="#fed7aa"
            opacity="0.7"
          />
        )}
        <path
          d={`M ${x} ${STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 0.55} L ${x} ${STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 3.45}`}
          stroke={inkColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d={`M ${x} ${STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 0.7} q 12 5 5 18 q -5 -3 -11 1 q 4 -11 -5 -19`}
          fill={inkColor}
        />
        <path
          d={`M ${x} ${STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 1.35} q 12 5 5 18 q -5 -3 -11 1 q 4 -11 -5 -19`}
          fill={inkColor}
        />
        {dotted && (
          <circle
            cx={x + 14}
            cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 2}
            r="2.8"
            fill={inkColor}
          />
        )}
      </>
    );
  }

  return (
    <>
      {active && (
        <circle
          cx={x}
          cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 2}
          r="18"
          fill="#fed7aa"
          opacity="0.7"
        />
      )}
      <path
        d={`M ${x} ${STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 0.6} L ${x} ${STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 3.4}`}
        stroke={inkColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d={`M ${x} ${STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 0.7} q 12 5 5 18 q -5 -3 -11 1 q 4 -11 -5 -19`}
        fill={inkColor}
      />
      {dotted && (
        <circle
          cx={x + 14}
          cy={STAFF_LAYOUT.topLineY + STAFF_LAYOUT.lineGap * 2 - 2}
          r="2.8"
          fill={inkColor}
        />
      )}
    </>
  );
}
