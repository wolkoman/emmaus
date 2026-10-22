"use server";

import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { loadEvents } from "@/domain/events/EventsLoader";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { CpPersonCompetences } from "@/util/cockpit.generated";
import { cache } from "react";

export const loadRangeEvents = cache(
  async (minString: string, maxString: string) => {
    const person = await resolveUserFromServer();
    if (!person?.competences.includes(CpPersonCompetences.WeeklyEditor)) {
      throw new Error("No authorization");
    }
    const min = new Date(minString),
      max = new Date(new Date(maxString).getTime() + 24 * 3600 * 1000);
    const { events } = await loadEvents({
      access: EventLoadAccess.WEEKLY,
      timeFrame: { min, max },
    });
    return events.filter((event) => !event.wholeday);
  },
);
