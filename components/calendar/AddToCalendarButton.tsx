import { CalendarEvent } from "@/domain/events/EventMapper";
import React from "react";
import { PiCalendarPlus } from "react-icons/pi";

export function AddToCalendarButton(props: { event: Partial<CalendarEvent> }) {
  const generateGoogleCalendarLink = (event: Partial<CalendarEvent>) => {
    const formatDateTime = (isoDateTime: string) => {
      return isoDateTime.replace(/-|:|\.\d+/g, "");
    };
    const startDateTime = formatDateTime(event?.start?.dateTime ?? "");
    const endDateTime = formatDateTime(event?.end?.dateTime ?? "");
    const title = encodeURIComponent(event?.summary ?? "");
    const details = encodeURIComponent(event?.description ?? "");
    const location = encodeURIComponent("Pfarre Emmaus am Wienerberg");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;
  };
  return (
    <button
      className="rounded p-2 text-sm opacity-0 hover:bg-black/5 hover:opacity-100 group-hover:opacity-70"
      onClick={() => window.open(generateGoogleCalendarLink(props.event))}
    >
      <PiCalendarPlus />
    </button>
  );
}
