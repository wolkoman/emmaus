"use client";

import {
  ACUTIS_DATE,
  AcutisEvent,
  isAcutisEvent,
} from "@/app/termine/AcutisEvent";
import { renderEventsGroupedByDate } from "@/components/calendar/RenderEventsGroupedByDate";
import {
  CalendarGroup,
  calendarGroupEmojis,
} from "@/domain/events/CalendarGroup";
import { groupEventsByDate } from "@/domain/events/CalendarGrouper";
import { getGroupSorting } from "@/domain/events/CalendarGroupSorter";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useMemo, useState } from "react";
import { ViewportList } from "react-viewport-list";

type VisibleCalendarGroup = Exclude<CalendarGroup, CalendarGroup.Invisible>;

const calendarGroups = Object.values(CalendarGroup)
  .filter((group) => group !== CalendarGroup.Invisible)
  .sort(
    (group1, group2) =>
      getGroupSorting(group2 as CalendarGroup) -
      getGroupSorting(group1 as CalendarGroup),
  ) as VisibleCalendarGroup[];

function TagSelector(props: {
  groups: VisibleCalendarGroup[];
  selectedGroup: VisibleCalendarGroup | null;
  onSelectGroup: (group: VisibleCalendarGroup | null) => void;
}) {
  return (
    <ScrollArea className="-mx-4 mb-4 w-[calc(100%+2rem)] md:mx-0 md:w-full">
      <div className="flex w-max gap-2 px-4 pb-2 md:w-full md:flex-wrap md:px-0 md:pb-0">
        <button
          type="button"
          onClick={() => props.onSelectGroup(null)}
          className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
            props.selectedGroup === null
              ? "border-black bg-black text-white"
              : "border-black/15 bg-white hover:bg-black/5"
          }`}
        >
          Alle
        </button>
        {props.groups.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => props.onSelectGroup(group)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
              props.selectedGroup === group
                ? "bg-primary border-primary text-white"
                : "border-black/15 bg-white hover:bg-black/5"
            }`}
          >
            <span>{calendarGroupEmojis[group]}</span>
            <span>{group}</span>
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="md:hidden" />
    </ScrollArea>
  );
}

export default function FilterableEventList(props: {
  events: CalendarEvent[];
  liturgies: Liturgy[];
}) {
  const [selectedGroup, setSelectedGroup] =
    useState<VisibleCalendarGroup | null>(null);
  const availableGroups = useMemo(
    () =>
      calendarGroups.filter((group) =>
        props.events.some((event) => event.groups.includes(group)),
      ),
    [props.events],
  );

  useEffect(() => {
    if (selectedGroup && !availableGroups.includes(selectedGroup)) {
      setSelectedGroup(null);
    }
  }, [availableGroups, selectedGroup]);

  const { groupedEntries, showAcutis } = useMemo(() => {
    const visible = selectedGroup
      ? props.events.filter((event) => event.groups.includes(selectedGroup))
      : props.events;
    const showAcutis = visible.some(isAcutisEvent);
    const entries = Object.entries(
      groupEventsByDate(visible.filter((event) => !isAcutisEvent(event))),
    );
    // The day must stay in the list even when the card replaced all its entries.
    if (showAcutis && !entries.some(([date]) => date === ACUTIS_DATE)) {
      const index = entries.findIndex(([date]) => date > ACUTIS_DATE);
      entries.splice(index === -1 ? entries.length : index, 0, [
        ACUTIS_DATE,
        [],
      ]);
    }
    return { groupedEntries: entries, showAcutis };
  }, [props.events, selectedGroup]);

  return (
    <>
      <TagSelector
        groups={availableGroups}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
      />
      {groupedEntries.length === 0 ? (
        <div className="rounded-md bg-black/5 px-4 py-3 text-sm">
          Keine Termine in dieser Kategorie.
        </div>
      ) : (
        <ViewportList items={groupedEntries}>
          {renderEventsGroupedByDate(
            undefined,
            props.liturgies,
            (date, events) =>
              showAcutis && date === ACUTIS_DATE ? (
                <AcutisEvent spaced={events.length > 0} />
              ) : null,
          )}
        </ViewportList>
      )}
    </>
  );
}
