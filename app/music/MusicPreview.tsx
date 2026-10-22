"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import {
  getDurationInQuarters,
  getTotalDurationInQuarters,
  type ParsedNote,
  type ParsedStaff,
} from "./music-format";
import { BarLine } from "./notation/BarLine";
import { LedgerLines } from "./notation/LedgerLines";
import { NoteGlyph } from "./notation/NoteGlyph";
import { RestGlyph } from "./notation/RestGlyph";
import { StaffLines } from "./notation/StaffLines";
import {
  STAFF_LAYOUT,
  type Clef,
  getLedgerLineYs,
  getNoteX,
  getNoteY,
  getStaffWidth,
} from "./notation/notation-layout";

type Meter = "2/4" | "3/4" | "4/4" | "6/8";
type ClefOverride = "auto" | Clef;

const METER_TO_QUARTERS: Record<Meter, number> = {
  "2/4": 2,
  "3/4": 3,
  "4/4": 4,
  "6/8": 3,
};

const EPSILON = 0.0001;

function TieArc({
  startX,
  endX,
  y,
}: {
  startX: number;
  endX: number;
  y: number;
}) {
  const controlY = y + 18;

  return (
    <path
      d={`M ${startX + 10} ${y + 10} Q ${(startX + endX) / 2} ${controlY} ${endX - 10} ${y + 10}`}
      fill="none"
      stroke="#1f2937"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  );
}

function TripletMarker({
  startX,
  endX,
  y,
}: {
  startX: number;
  endX: number;
  y: number;
}) {
  const centerX = (startX + endX) / 2;
  const markerY = y - 32;

  return (
    <>
      <path
        d={`M ${startX - 2} ${markerY} Q ${startX + 8} ${markerY - 8} ${startX + 18} ${markerY}`}
        fill="none"
        stroke="#1f2937"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d={`M ${endX - 18} ${markerY} Q ${endX - 8} ${markerY - 8} ${endX + 2} ${markerY}`}
        fill="none"
        stroke="#1f2937"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <text
        x={centerX}
        y={markerY + 4}
        textAnchor="middle"
        className="fill-gray-900 text-[13px] font-semibold"
      >
        3
      </text>
    </>
  );
}

function getPickupOptions(meter: Meter) {
  const [top, bottom] = meter.split("/").map(Number);
  const unitInQuarters = 4 / bottom;

  return [
    { value: "0", label: "No pickup" },
    ...Array.from({ length: top - 1 }, (_, index) => {
      const count = index + 1;
      return {
        value: String(count * unitInQuarters),
        label: `${count}/${bottom}`,
      };
    }),
  ];
}

function getBarLineQuarters(
  totalQuarters: number,
  measureLength: number,
  pickupLength: number,
) {
  const barLines: number[] = [];
  let nextBoundary = pickupLength > EPSILON ? pickupLength : measureLength;

  while (nextBoundary < totalQuarters - EPSILON) {
    barLines.push(nextBoundary);
    nextBoundary += measureLength;
  }

  return barLines;
}

function getTripletGroups(notes: ParsedNote[]) {
  const groups: Array<{ startIndex: number; endIndex: number }> = [];

  for (let index = 0; index < notes.length; index += 1) {
    if (!notes[index].triplet) {
      continue;
    }

    let endIndex = index;
    while (endIndex + 1 < notes.length && notes[endIndex + 1].triplet) {
      endIndex += 1;
    }

    for (let groupStart = index; groupStart + 2 <= endIndex; groupStart += 3) {
      groups.push({ startIndex: groupStart, endIndex: groupStart + 2 });
    }

    index = endIndex;
  }

  return groups;
}

function getNoteStartQuarters(notes: ParsedNote[]) {
  let elapsed = 0;

  return notes.map((note) => {
    const start = elapsed;
    elapsed += getDurationInQuarters(note);
    return start;
  });
}

function StaffSvg({
  staff,
  width,
  meter,
  barLineQuarters,
  activeNoteIds,
  clefOverride,
}: {
  staff: ParsedStaff;
  width: number;
  meter: Meter;
  barLineQuarters: number[];
  activeNoteIds: string[];
  clefOverride: ClefOverride;
}) {
  const clef = clefOverride === "auto" ? staff.clef : clefOverride;
  const noteStartQuarters = getNoteStartQuarters(staff.notes);
  const tripletGroups = getTripletGroups(staff.notes);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-3">
      <svg
        viewBox={`0 0 ${width} ${STAFF_LAYOUT.height + 28}`}
        className="min-w-[720px]"
      >
        <StaffLines
          width={width}
          clef={clef}
          meter={meter}
          label={staff.label}
        />
        {barLineQuarters.map((barQuarter) => (
          <BarLine key={barQuarter} x={getNoteX(barQuarter) - 8} />
        ))}
        {tripletGroups.map((group) => {
          const startX = getNoteX(noteStartQuarters[group.startIndex]);
          const endQuarter =
            noteStartQuarters[group.endIndex] +
            getDurationInQuarters(staff.notes[group.endIndex]);
          const endX = getNoteX(endQuarter) - 12;
          const topY = Math.min(
            ...staff.notes
              .slice(group.startIndex, group.endIndex + 1)
              .map((note) => getNoteY(note, clef)),
          );

          return (
            <TripletMarker
              key={`${staff.id}-${group.startIndex}`}
              startX={startX}
              endX={endX}
              y={topY}
            />
          );
        })}
        {staff.notes.map((note, index) => {
          const x = getNoteX(noteStartQuarters[index]);
          const y = getNoteY(note, clef);
          const ledgerYs = getLedgerLineYs(y);
          const nextNote = staff.notes[index + 1];
          const tieEndX = nextNote
            ? getNoteX(noteStartQuarters[index + 1])
            : null;

          return (
            <g key={note.id}>
              <LedgerLines x={x} ys={ledgerYs} />
              {note.type === "rest" ? (
                <RestGlyph
                  duration={note.duration}
                  dotted={note.dotted}
                  active={activeNoteIds.includes(note.id)}
                  x={x}
                />
              ) : (
                <NoteGlyph
                  note={note}
                  x={x}
                  y={y}
                  active={activeNoteIds.includes(note.id)}
                />
              )}
              {note.type === "note" && note.tieToNext && tieEndX !== null && (
                <TieArc startX={x} endX={tieEndX} y={y} />
              )}
              {note.lyric && note.lyric !== "_" && (
                <text
                  x={x}
                  y={STAFF_LAYOUT.height + 18}
                  textAnchor="middle"
                  className="fill-gray-700 text-[12px]"
                >
                  {note.lyric}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function MusicPreview({
  staves,
  activeNoteIds,
}: {
  staves: ParsedStaff[];
  activeNoteIds: string[];
}) {
  const [clefOverride, setClefOverride] = useState<ClefOverride>("auto");
  const [meter, setMeter] = useState<Meter>("4/4");
  const pickupOptions = useMemo(() => getPickupOptions(meter), [meter]);
  const [pickupValue, setPickupValue] = useState("0");
  const totalQuarters = Math.max(
    ...staves.map((staff) => getTotalDurationInQuarters(staff.notes)),
    0,
  );
  const width = getStaffWidth(totalQuarters);
  const measureLength = METER_TO_QUARTERS[meter];
  const pickupLength = Number(pickupValue);
  const barLineQuarters = getBarLineQuarters(
    totalQuarters,
    measureLength,
    pickupLength,
  );

  useEffect(() => {
    if (!pickupOptions.some((option) => option.value === pickupValue)) {
      setPickupValue("0");
    }
  }, [pickupOptions, pickupValue]);

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-950">Preview</h3>
        <p className="mt-1 text-sm text-gray-600">
          Multiple staffs share the same meter and pickup, align by musical
          time, and can show lyrics under notes.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(["auto", "bass", "treble"] as ClefOverride[]).map((option) => (
          <Button
            key={option}
            variant={clefOverride === option ? "default" : "outline"}
            size="sm"
            onClick={() => setClefOverride(option)}
          >
            {option === "auto"
              ? "Auto Clef"
              : option === "bass"
                ? "Bass"
                : "Treble"}
          </Button>
        ))}
        {(["2/4", "3/4", "4/4", "6/8"] as Meter[]).map((option) => (
          <Button
            key={option}
            variant={meter === option ? "default" : "outline"}
            size="sm"
            onClick={() => setMeter(option)}
          >
            {option}
          </Button>
        ))}
        <Select
          value={pickupValue}
          onValueChange={(value) => setPickupValue(value ?? "0")}
        >
          <SelectTrigger size="sm" className="min-w-32">
            <SelectValue>
              {pickupOptions.find((option) => option.value === pickupValue)
                ?.label || "Pickup"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pickupOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-4">
        {staves.map((staff) => (
          <StaffSvg
            key={staff.id}
            staff={staff}
            width={width}
            meter={meter}
            barLineQuarters={barLineQuarters}
            activeNoteIds={activeNoteIds}
            clefOverride={clefOverride}
          />
        ))}
      </div>
    </div>
  );
}
