"use client";

import React, { useState } from "react";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { PiCheck, PiCopy } from "react-icons/pi";

export function ShareEventButton(props: { event: Partial<CalendarEvent> }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const eventInfo = `${props.event.summary}
Wann: ${new Date(props.event.date ?? "").toLocaleDateString("de-AT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })} ${props.event.time} Uhr
Wo: Pfarre Emmaus am Wienerberg, Tesarekplatz 2, 1100 Wien
${(props.event.description?.length ?? 0) > 2 ? `Infos: ${props.event.description}` : ""}`;

    await navigator.clipboard.writeText(eventInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`group rounded p-2 text-sm opacity-0 hover:bg-black/5 hover:opacity-100 group-hover:opacity-70 ${copied ? "pointer-events-none" : ""} relative`}
    >
      {copied ? <PiCheck /> : <PiCopy />}
      <div>
        {copied && (
          <span className="absolute right-0 top-0 -translate-y-full whitespace-nowrap bg-white px-1 py-0.5 shadow-sm">
            Infos kopiert
          </span>
        )}
      </div>
    </button>
  );
}
