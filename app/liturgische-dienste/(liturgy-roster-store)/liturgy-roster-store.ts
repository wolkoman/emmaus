import { cancelLiturgicalService } from "@/app/liturgische-dienste/(liturgy-roster-store)/cancel";
import getPlanningData from "@/app/liturgische-dienste/(liturgy-roster-store)/index";
import inform from "@/app/liturgische-dienste/(liturgy-roster-store)/inform";
import {
  upsertLiturgy,
  upsertLiturgyPosition,
} from "@/app/liturgische-dienste/(liturgy-roster-store)/save";
import { servantAllowance } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";
import transfer from "@/app/liturgische-dienste/(liturgy-roster-store)/transfer";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { createLoadedStore } from "@/store/CreateLoadedStore";
import {
  CpLiturgy,
  CpLiturgyEvent,
  CpLiturgyRoster,
  CpLiturgyRosterPosition,
  CpPerson,
} from "@/util/cockpit.generated";
import { createStore } from "zustand";
import { combine } from "zustand/middleware";

export const useLiturgyRoster = createLoadedStore(
  createStore(
    combine(
      {
        persons: [] as CpPerson[],
        roster: [] as CpLiturgyRoster[],
        liturgies: {} as CpLiturgy,
        liturgyEvents: [] as CpLiturgyEvent[],
        events: [] as CalendarEvent[],
        loading: false,
        loaded: false,
        error: false,
      },
      (set, get) => ({
        load: () => {
          if (get().loading) return;
          if (get().loaded) return;
          set((state) => ({ ...state, loading: true }));
          getPlanningData()
            .then((data) =>
              set((state) => ({
                ...state,
                loading: false,
                loaded: true,
                roster: data.roster,
                liturgies: data.liturgies,
                persons: data.users,
                events: data.events,
                liturgyEvents: data.liturgyEvents,
              })),
            )
            .catch(() => {
              set({ loaded: true, loading: false, error: true });
            });
        },
        getUsers(
          role: CpLiturgyRosterPosition,
          liturgyEventId?: string,
        ): CpPerson[] {
          const allowedRoles = servantAllowance.find((allowance) =>
            allowance.allowed.some((allowed) => allowed === role),
          );
          if (!allowedRoles) return [];
          return get().persons.filter(
            (person) => person.competences.includes(allowedRoles.servant) /* &&
              (liturgyEventId
                ? get().roster.find(
                    (r) =>
                      liturgyEventId === r.liturgyEventId &&
                      r.userId === person._id,
                  )
                : true)*/,
          );
        },
        cancel(liturgicalEventId: string, position: CpLiturgyRosterPosition) {
          return cancelLiturgicalService(liturgicalEventId, position)
            .then(({ updatedLiturgyEvent, updatedRoster }) => {
              console.log({ updatedLiturgyEvent, updatedRoster });
              return set((store) => ({
                liturgyEvents: [
                  ...store.liturgyEvents.filter(
                    (r) => r._id !== updatedLiturgyEvent?._id,
                  ),
                  updatedLiturgyEvent,
                ],
                roster: [
                  ...store.roster.filter((r) => r._id !== updatedRoster._id),
                  updatedRoster,
                ],
              }));
            })
            .catch(() => alert("Fehler beim Austragen!"));
        },
        async upsert(
          liturgyEventId: string,
          position: CpLiturgyRosterPosition,
          personId: string | null,
        ) {
          return upsertLiturgyPosition(liturgyEventId, position, personId).then(
            (roster) =>
              set((store) => ({
                roster: [
                  ...store.roster.filter(
                    (r) =>
                      !(
                        r.liturgyEventId === liturgyEventId &&
                        r.position === position
                      ),
                  ),
                  ...(roster ? [roster] : []),
                ],
              })),
          );
        },
        async upsertLiturgy(
          calendarEventId: string,
          date: string,
          liturgyName: string,
        ) {
          return upsertLiturgy(calendarEventId, date, liturgyName).then(
            (liturgyEvent) =>
              set((store) => ({
                liturgyEvents: [
                  ...store.liturgyEvents
                    .filter((r) => r._id !== liturgyEvent._id)
                    .map((r) =>
                      r.eventId === calendarEventId
                        ? { ...r, calendarEventId: null }
                        : r,
                    ),
                  liturgyEvent,
                ],
              })),
          );
        },
        async transfer(liturgyEventId: string, role: CpLiturgyRosterPosition) {
          return transfer(liturgyEventId, role)
            .then((roster) =>
              set((store) => ({
                roster: [
                  ...store.roster.filter((r) => r._id !== roster._id),
                  roster,
                ],
              })),
            )
            .catch(() => alert("Fehler beim Austragen!"));
        },
        async inform(rosterIds: string[], withMail: boolean) {
          try {
            const updatedRosters = await inform(rosterIds, withMail);
            set((store) => ({
              roster: [
                ...store.roster.filter((r) => !rosterIds.includes(r._id)),
                ...updatedRosters,
              ],
            }));
          } catch (error) {
            console.error("Error informing users:", error);
            throw error;
          }
        },
      }),
    ),
  ),
);
