"use server";

import { loadCachedEvents } from "@/domain/events/EventsLoader";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { isLiturgyPlaner } from "@/app/liturgische-dienste/(liturgy-roster-store)/permission-util";
import { servantAllowance } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";
import { CpPerson } from "@/util/cockpit.generated";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";

export default async function getPlanningData() {
  const user = await resolveUserFromServer();

  // Everyone with a login may read the plan; changes are checked per action.
  if (!user) throw Error("Unauthenticated");
  const planner = isLiturgyPlaner(user);

  const cutoff = new Date(new Date().getTime() - 1000 * 3600 * 48).getTime();

  const repo = liturgyRepo();
  const [liturgyEvents, roster, liturgies, users] = await Promise.all([
    repo
      .fetchLiturgyEvents()
      .then((es) => es.filter((e) => new Date(e.date).getTime() > cutoff)),
    repo.fetchLiturgyRosters(),
    repo.fetchLiturgy(),
    repo.fetchPersons(),
  ]);
  const liturgyEventIds = liturgyEvents.map((l) => l._id);
  const events = await loadCachedEvents(
    planner
      ? { access: EventLoadAccess.PRIVATE_ACCESS }
      : {
          access: EventLoadAccess.READER,
          ids: [
            ...new Set(
              liturgyEvents
                .map((event) => event.eventId)
                .filter((value): value is string => !!value),
            ),
          ],
        },
  );
  return {
    roster: roster.filter((r) => liturgyEventIds.includes(r.liturgyEventId)),
    users: users
      .filter(isServant)
      .map((person) => publicPerson(person, planner)),
    liturgies,
    events: events.events,
    liturgyEvents,
  };
}

const servantCompetences = servantAllowance.map(
  (allowance) => allowance.servant,
);

function isServant(person: CpPerson) {
  return person.competences.some((c) => servantCompetences.includes(c));
}

/** Only what the plan shows; never the login code. Emails only for planners, who notify. */
function publicPerson(person: CpPerson, planner: boolean): CpPerson {
  return {
    ...person,
    username: "",
    code: "",
    last_login: "",
    email: planner ? person.email : "",
  };
}
