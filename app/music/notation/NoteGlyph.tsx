import { formatDuration, type ParsedNote } from "../music-format";
import { getBottomLineY } from "./notation-layout";

export function NoteGlyph({
  note,
  x,
  y,
  active = false,
  showLabel = true,
}: {
  note: ParsedNote;
  x: number;
  y: number;
  active?: boolean;
  showLabel?: boolean;
}) {
  const noteIsFilled =
    note.duration === "q" || note.duration === "e" || note.duration === "s";
  const needsStem = note.duration !== "w";
  const stemUp = y >= 50 + 16 * 2;
  const inkColor = active ? "#ea580c" : "#1f2937";
  const noteFill = active ? "#fdba74" : noteIsFilled ? "#1f2937" : "white";

  return (
    <>
      {active && <circle cx={x} cy={y} r="18" fill="#fed7aa" opacity="0.7" />}
      {note.accidental && (
        <text x={x - 22} y={y + 5} className="text-[20px]" fill={inkColor}>
          {note.accidental}
        </text>
      )}
      <ellipse
        cx={x}
        cy={y}
        rx="10"
        ry="7"
        fill={noteFill}
        stroke={inkColor}
        strokeWidth="1.5"
        transform={`rotate(-18 ${x} ${y})`}
      />
      {note.dotted && <circle cx={x + 16} cy={y - 2} r="2.8" fill={inkColor} />}
      {needsStem && (
        <line
          x1={stemUp ? x + 8 : x - 8}
          y1={y}
          x2={stemUp ? x + 8 : x - 8}
          y2={stemUp ? y - 34 : y + 34}
          stroke={inkColor}
          strokeWidth="1.5"
        />
      )}
      {(note.duration === "e" || note.duration === "s") && (
        <path
          d={
            stemUp
              ? `M ${x + 8} ${y - 34} q 10 6 0 18`
              : `M ${x - 8} ${y + 34} q -10 -6 0 -18`
          }
          fill="none"
          stroke={inkColor}
          strokeWidth="1.5"
        />
      )}
      {note.duration === "s" && (
        <path
          d={
            stemUp
              ? `M ${x + 8} ${y - 24} q 10 6 0 18`
              : `M ${x - 8} ${y + 24} q -10 -6 0 -18`
          }
          fill="none"
          stroke={inkColor}
          strokeWidth="1.5"
        />
      )}
      {showLabel && (
        <text
          x={x}
          y={getBottomLineY() + 36}
          textAnchor="middle"
          className="fill-gray-500 text-[11px]"
        >
          {note.pitch}{" "}
          {formatDuration(note.duration, note.dotted, note.triplet)}
        </text>
      )}
    </>
  );
}
