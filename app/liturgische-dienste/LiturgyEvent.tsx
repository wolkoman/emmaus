import { formatDate, formatTime } from "@/app/(shared)/Localization";
import { AppTableHeader } from "@/components/intern/AppTable";
import { cn } from "@/util/utils";
import {
  PiBookOpen,
  PiCalendarBlank,
  PiKey,
  PiMusicNotes,
} from "react-icons/pi";
import { LiturgyJobsView } from "@/app/liturgische-dienste/LiturgyJobsView";
import { LiturgySelectionView } from "@/app/liturgische-dienste/LiturgySelectionView";
import React, { useMemo } from "react";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { CpLiturgyRosterPosition } from "@/util/cockpit.generated";
import { roleToString } from "@/domain/service/Service";

export function LiturgyEvent(props: { event: CalendarEvent }) {
  const [liturgyEvents, allRoster] = useLiturgyRoster((state) => [
    state.liturgyEvents,
    state.roster,
  ]);
  const data = useMemo(() => {
    const liturgyEvent = liturgyEvents.find(
      (e) => e.eventId === props.event.id,
    );
    const roster = allRoster.filter(
      (r) => r.liturgyEventId === liturgyEvent?._id,
    );
    return { liturgyEvent, roster };
  }, [liturgyEvents, props.event, allRoster]);

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", EVENT_COLUMNS)}>
      <div className="flex flex-col sm:col-span-2 lg:col-span-1">
        <div className="text-sm font-semibold">
          {formatDate(props.event?.date)}{" "}
          {formatTime(props.event?.start.dateTime)}
        </div>
        <div className="line-clamp-1 text-xs text-black/60">
          {props.event.summary}
        </div>
        {props.event.visibility === "private" && (
          <div className="text-xs text-black/50">Vertraulich</div>
        )}
      </div>
      <LiturgySelectionView calendarEvent={props.event} />
      {data.liturgyEvent && (
        <>
          <LiturgyJobsView
            label={ROLE_COLUMNS[1].label}
            positions={[
              CpLiturgyRosterPosition.READER1,
              CpLiturgyRosterPosition.READER2,
            ]}
            liturgyEventId={data.liturgyEvent._id}
          />
          <LiturgyJobsView
            label={ROLE_COLUMNS[2].label}
            positions={[CpLiturgyRosterPosition.SACRISTAN]}
            liturgyEventId={data.liturgyEvent._id}
          />
          <LiturgyJobsView
            label={ROLE_COLUMNS[3].label}
            positions={[CpLiturgyRosterPosition.MUSICIAN]}
            liturgyEventId={data.liturgyEvent._id}
          />
        </>
      )}
    </div>
  );
}

/** Shared by the event rows and the column header of a plan month. */
export const EVENT_COLUMNS =
  "lg:grid-cols-[8rem_minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] lg:gap-4";

export const ROLE_COLUMNS = [
  { label: "Liturgie", icon: <PiCalendarBlank /> },
  { label: "Lektor:innen", icon: <PiBookOpen /> },
  { label: roleToString(CpLiturgyRosterPosition.SACRISTAN), icon: <PiKey /> },
  {
    label: roleToString(CpLiturgyRosterPosition.MUSICIAN),
    icon: <PiMusicNotes />,
  },
];

/** Column labels of the plan table (wide screens only). */
export function EventColumnsHeader() {
  return (
    <AppTableHeader className={cn("hidden lg:grid", EVENT_COLUMNS)}>
      <div>Termin</div>
      {ROLE_COLUMNS.map((column) => (
        <div key={column.label} className="flex items-center gap-1.5">
          {column.icon} {column.label}
        </div>
      ))}
    </AppTableHeader>
  );
}
