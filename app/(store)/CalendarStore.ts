"use client";

import { createStore } from "zustand";
import { combine } from "zustand/middleware";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { loadEventsFromServer } from "@/domain/events/EventsLoader";
import { createLoadedStore } from "@/store/CreateLoadedStore";
import { userStore } from "@/store/UserStore";
import { CpPersonCompetences } from "@/util/cockpit.generated";

export const useCalendarStore = createLoadedStore(
  createStore(
    combine(
      {
        items: [] as CalendarEvent[],
        loaded: false,
        loading: false,
        error: false,
        cache: undefined as string | undefined,
        lastLoadedWithToken: "none",
        load: Function,
      },
      (set, get) => ({
        load: async () => {
          if (get().loading) return;
          if (get().loaded) return;
          await userStore.getState().load();
          const person = userStore.getState().person;
          if (!person?.competences.includes(CpPersonCompetences.Calendar))
            return;
          set((state) => ({ ...state, loading: true }));
          loadEventsFromServer(true)
            .then((data) => {
              console.log("Load calendar", data);
              if (data === null) return;
              set({
                items: data.events,
                loaded: true,
                loading: false,
                error: false,
                cache: data.cache,
              });
            })
            .catch((error) => {
              console.log({ error });
              setTimeout(() => {
                set((state) => ({ ...state, loaded: false }));
                get().load();
              }, 3000);
              set({ items: [], loaded: true, loading: false, error: true });
            });
        },
      }),
    ),
  ),
);
