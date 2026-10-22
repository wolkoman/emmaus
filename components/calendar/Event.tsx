"use client";

import { CalendarEvent, CalendarTag } from "@/domain/events/EventMapper";
import { EventDescription } from "./EventUtils";

import { AddToCalendarButton } from "@/components/calendar/AddToCalendarButton";
import { ShareEventButton } from "@/components/calendar/ShareEventButton";
import { CalendarGroup } from "@/domain/events/CalendarGroup";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { PiEyeSlash } from "react-icons/pi";

export function Event({
  event,
  liturgy,
  liturgyNameDesktopOnly,
}: {
  event: Partial<CalendarEvent>;
  small?: boolean;
  liturgy?: Liturgy;
  liturgyNameDesktopOnly?: boolean;
}) {
  const cancelled = event.tags?.includes(CalendarTag.cancelled);
  const isPrivate = event.visibility === "private";
  const liturgyStyle = event.groups?.includes(CalendarGroup.Messe)
    ? {
        v: "bg-[oklch(0.95_0.025_300)] ring-[oklch(0.84_0.06_300)]",
        w: "bg-[oklch(0.95_0.025_85)] ring-[oklch(0.84_0.06_85)]",
        g: "bg-[oklch(0.95_0.025_170)] ring-[oklch(0.84_0.06_170)]",
        r: "bg-[oklch(0.95_0.025_25)] ring-[oklch(0.84_0.06_25)]",
        "": "bg-[oklch(0.97_0.005_194)] ring-[oklch(0.88_0.01_194)]",
      }[liturgy?.color ?? ""]
    : "bg-white ring-black/10";
  return (
    <div className="group flex flex-col">
      <div
        className={`px-4 py-3 ${cancelled ? "opacity-60" : ""} ${liturgyStyle} ${isPrivate ? "rounded-t-lg" : "rounded-lg"} flex grow flex-col text-balance ring-1 ring-inset`}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div
            className={`wrap-break-words min-w-0 flex-1 text-base font-semibold whitespace-normal ${cancelled ? "line-through" : ""} leading-5`}
          >
            {event.time ?? ""} {event.summary ?? ""}
          </div>
          {cancelled && (
            <div className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium">
              Abgesagt
            </div>
          )}
        </div>
        <div className="text-black/80">
          <EventDescription
            event={event}
            liturgyNameDesktopOnly={liturgyNameDesktopOnly}
          />
        </div>
        <div className="mt-3 hidden grow items-end justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <AddToCalendarButton event={event} />
          <ShareEventButton event={event} />
        </div>
      </div>
      {isPrivate && (
        <div className="flex items-center gap-2 rounded-b-lg border border-t-0 border-black/10 bg-black/[0.03] px-4 py-1.5 text-sm">
          <PiEyeSlash />
          Vertraulich
        </div>
      )}
    </div>
  );
}
