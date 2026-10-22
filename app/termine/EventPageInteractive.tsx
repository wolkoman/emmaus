"use client";

import { staticEventId } from "@/app/termine/StaticEventId";
import { CalendarErrorNotice } from "@/components/calendar/CalendarErrorNotice";
import { EventsObject } from "@/domain/events/EventMapper";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import { useCalendarStore } from "@/store/CalendarStore";
import { useUserStore } from "@/store/UserStore";
import { useEffect } from "react";
import { PiSpinnerBold } from "react-icons/pi";
import FilterableEventList from "@/app/termine/FilterableEventList";

export default function EventPageInteractive(props: {
  liturgies: Liturgy[];
  eventsObject: EventsObject;
}) {
  const user = useUserStore((state) => state.person);
  const calendar = useCalendarStore((state) => state);
  useEffect(() => {
    if (calendar.loaded) document.getElementById(staticEventId)?.remove();
  }, [calendar.loaded]);
  useEffect(() => {
    if (user) calendar.load();
  }, [user]);
  if (!user) return <></>;
  return (
    <>
      <div className="relative mt-4 grow pb-4">
        {calendar.error && <CalendarErrorNotice />}
        {calendar.loading && (
          <div className="flex animate-pulse items-center gap-2 rounded-md bg-black/5 px-4 py-2">
            <PiSpinnerBold className="animate-spin" /> Vertrauliche Termine
            laden noch..
          </div>
        )}
      </div>
      <FilterableEventList events={calendar.items} liturgies={props.liturgies} />
    </>
  );
}
