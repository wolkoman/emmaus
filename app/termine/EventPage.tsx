import { loadLiturgyData } from "@/domain/liturgy/liturgy-loading";
import { loadEvents } from "@/domain/events/EventsLoader";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import React from "react";
import EventPageInteractive from "@/app/termine/EventPageInteractive";
import { staticEventId } from "@/app/termine/StaticEventId";
import FilterableEventList from "@/app/termine/FilterableEventList";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { connection } from "next/server";

// Remote, not in the page shell: keeps 15-minute freshness without an ISR page write per refresh.
async function loadTermine() {
  "use cache: remote";
  cacheLife({ stale: 300, revalidate: 900, expire: 86400 });
  return await Promise.all([
    loadLiturgyData(),
    loadEvents({ access: EventLoadAccess.PUBLIC }),
  ]);
}

export async function EventPage() {
  await connection();
  const [liturgyData, eventsObject] = await loadTermine();
  return (
    <>
      <EventPageInteractive
        liturgies={liturgyData}
        eventsObject={eventsObject}
      />
      <div id={staticEventId}>
        <FilterableEventList
          events={eventsObject.events}
          liturgies={liturgyData}
        />
      </div>
    </>
  );
}
