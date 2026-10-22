"use server";
import { getGoogleAuthClient } from "../../(shared)/GoogleAuthClient";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { EventsObject } from "./EventMapper";
import { loadCalendar } from "./CalendarLoader";
import {
  EventLoadAccess,
  EventLoadOptions,
} from "@/domain/events/EventLoadOptions";
import { getTimeOfEvent } from "@/domain/events/EventSorter";
import { GoogleAuth } from "google-auth-library";
import { CpPersonCompetences } from "@/util/cockpit.generated";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";
import { cacheLife } from "next/dist/server/use-cache/cache-life";

export async function loadEventsFromServer(privateOnly?: boolean) {
  const user = await resolveUserFromServer();
  const privateAccess =
    user && user.competences.includes(CpPersonCompetences.Calendar);

  if (!privateAccess && privateOnly) {
    console.log("Blocked calendar access");
    return null;
  }
  console.log("noblock calendar access");

  return await loadCachedEvents({
    access: privateAccess
      ? EventLoadAccess.PRIVATE_ACCESS
      : EventLoadAccess.PUBLIC,
  });
}

export const loadCachedEvents = async (
  options: EventLoadOptions,
): Promise<EventsObject> => {
  "use cache";
  cacheLife("hours");
  const authClient = await getGoogleAuthClient();
  return await loadEvents(options, authClient);
};

export const loadEvents = async (
  options: EventLoadOptions,
  authClient?: GoogleAuth<any>,
): Promise<EventsObject> => {
  if (!authClient) authClient = await getGoogleAuthClient();

  const repo = liturgyRepo();
  const [rosterEvents, liturgyEvents] = await Promise.all([
    repo.fetchLiturgyRosters(),
    repo.fetchLiturgyEvents(),
  ]);
  const roster = rosterEvents.map((r) => ({
    ...r,
    calEventId: liturgyEvents.find((l) => l._id === r.liturgyEventId)?.eventId,
  }));

  return loadCalendar(options, roster, authClient, liturgyEvents)
    .then((eventList) =>
      eventList
        .flat()
        .filter((event) => !!event)
        .sort((a, b) => getTimeOfEvent(a) - getTimeOfEvent(b)),
    )
    .then(async (events) => ({ events }));
};
