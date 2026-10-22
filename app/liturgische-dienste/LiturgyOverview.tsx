"use client";
import { formatDate } from "@/app/(shared)/Localization";
import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import {
  isLiturgyPlaner,
  isLiturgyUser,
} from "@/app/liturgische-dienste/(liturgy-roster-store)/permission-util";
import { LiturgySite } from "@/app/liturgische-dienste/IndexPage";
import { LiturgyDashboard } from "@/app/liturgische-dienste/LiturgyDashboard";
import {
  EventColumnsHeader,
  LiturgyEvent,
} from "@/app/liturgische-dienste/LiturgyEvent";
import { NotificationsSheet } from "@/app/liturgische-dienste/NotificationsSheet";
import { ReminderSetting } from "@/app/liturgische-dienste/ReminderSetting";
import { AppShell, AppTabs } from "@/components/intern/AppShell";
import {
  AppSidebarLayout,
  AppSidebarLink,
  AppSidebarSection,
} from "@/components/intern/AppSidebar";
import {
  AppTable,
  AppTableGroup,
  AppTableRow,
} from "@/components/intern/AppTable";
import { AppCard } from "@/components/intern/AppUI";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { CalendarGroup } from "@/domain/events/CalendarGroup";
import { CalendarEvent } from "@/domain/events/EventMapper";
import { useUserStore } from "@/store/UserStore";
import { Fragment, useState } from "react";
import {
  PiBellBold,
  PiCalendarBlank,
  PiCheckBold,
  PiChecksBold,
} from "react-icons/pi";

export type View = "mine" | "plan";

/**
 * The liturgy roster app: "Meine Dienste" or the whole "Dienstplan" in the
 * shared app frame.
 */
export function LiturgyOverview(props: { initialView?: View }) {
  const person = useUserStore((state) => state.person);
  const planner = isLiturgyPlaner(person);
  // Without a liturgical role there are no own duties: the plan is read-only.
  const servant = isLiturgyUser(person);
  // Planners mostly work on the whole plan; everyone else on their duties.
  // Derived until chosen, because the person loads after the first render.
  const [chosen, setView] = useState<View | null>(null);
  const view = !servant
    ? "plan"
    : (chosen ?? props.initialView ?? (planner ? "plan" : "mine"));

  return (
    <AppShell
      title="Liturgische Dienste"
      center={
        servant && (
          <AppTabs
            label="Ansicht"
            tabs={
              [
                ["mine", "Meine Dienste"],
                ["plan", "Dienstplan"],
              ] as const
            }
            value={view}
            onChange={setView}
          />
        )
      }
      actions={
        planner && (
          <Sheet>
            <SheetTrigger asChild>
              {/* Icon only on phones: the header has no room for the label. */}
              <Button
                variant="outline"
                aria-label="Benachrichtigen"
                title="Benachrichtigen"
              >
                <PiBellBold />
                <span className="hidden sm:inline">Benachrichtigen</span>
              </Button>
            </SheetTrigger>
            <NotificationsSheet />
          </Sheet>
        )
      }
    >
      <LiturgySite>
        {view === "mine" ? (
          <MyDuties onShowPlan={() => setView("plan")} />
        ) : (
          <RosterPlan />
        )}
      </LiturgySite>
    </AppShell>
  );
}

function MyDuties(props: { onShowPlan: () => void }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <ReminderSetting />
      <LiturgyDashboard
        emptyState={
          <AppCard className="p-8 text-center text-black/60">
            Derzeit sind Sie für keinen Dienst eingeteilt, und es sind keine
            Dienste offen.{" "}
            <button
              className="text-emmaus underline-offset-2 hover:underline"
              onClick={props.onShowPlan}
            >
              Zum Dienstplan
            </button>
          </AppCard>
        }
      />
    </div>
  );
}

/** Liturgical events of the plan, grouped by month (year included). */
function useMonths(): { label: string; events: CalendarEvent[] }[] {
  const events = useLiturgyRoster((state) => state.events);
  const months: { label: string; events: CalendarEvent[] }[] = [];
  for (const event of events) {
    if (
      !event.groups.includes(CalendarGroup.Messe) &&
      !event.groups.includes(CalendarGroup.Gottesdienst)
    ) {
      continue;
    }
    const label = formatDate(event.date, { month: "long", year: "numeric" });
    const month = months.at(-1)?.label === label ? months.at(-1) : undefined;
    if (month) month.events.push(event);
    else months.push({ label, events: [event] });
  }
  return months;
}

function RosterPlan() {
  const months = useMonths();

  return (
    <AppSidebarLayout
      sidebar={
        <>
          <AppSidebarSection title="Monate">
            {months.map((month, index) => (
              <AppSidebarLink
                key={month.label}
                href={`#monat-${index}`}
                icon={<PiCalendarBlank />}
              >
                {month.label}
              </AppSidebarLink>
            ))}
          </AppSidebarSection>
          <AppSidebarSection title="Status">
            <AppSidebarLink icon={<PiCheckBold className="text-green-600" />}>
              informiert
            </AppSidebarLink>
            <AppSidebarLink icon={<PiChecksBold className="text-green-600" />}>
              am Vortag erinnert
            </AppSidebarLink>
            <AppSidebarLink icon={<PiBellBold className="text-blue-600" />}>
              noch nicht informiert
            </AppSidebarLink>
            <AppSidebarLink
              icon={<span className="block size-2.5 rounded-full bg-red-600" />}
            >
              abgesagt
            </AppSidebarLink>
          </AppSidebarSection>
        </>
      }
    >
      <AppTable flush>
        <EventColumnsHeader />
        {months.map((month, index) => (
          <Fragment key={month.label}>
            <AppTableGroup id={`monat-${index}`}>{month.label}</AppTableGroup>
            {month.events.map((event) => (
              <AppTableRow key={event.id}>
                <LiturgyEvent event={event} />
              </AppTableRow>
            ))}
          </Fragment>
        ))}
      </AppTable>
    </AppSidebarLayout>
  );
}
