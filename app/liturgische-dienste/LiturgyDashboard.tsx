import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { useUserStore } from "@/store/UserStore";
import {
  CpLiturgyRoster,
  CpLiturgyRosterStatus,
} from "@/util/cockpit.generated";
import { roleToString } from "@/domain/service/Service";
import { formatDate, formatTime } from "@/app/(shared)/Localization";
import { ReadingLink } from "@/app/liturgische-dienste/ReadingLink";
import { CancelDutyButton } from "@/app/liturgische-dienste/CancelDutyButton";
import React from "react";
import {
  AppTable,
  AppTableHeader,
  AppTableRow,
} from "@/components/intern/AppTable";
import { SectionHeading } from "@/components/intern/AppUI";
import { cn } from "@/util/utils";
import { TransferDutyButton } from "@/app/liturgische-dienste/TransferDutyButton";
import { getAllowedRoles } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";

export function LiturgyDashboard(props: { emptyState?: React.ReactNode }) {
  const { events, roster, liturgyEvents, liturgies } = useLiturgyRoster(
    (state) => state,
  );
  const person = useUserStore((state) => state.person);
  const allowedRoles = getAllowedRoles(person, "self");
  const myDuties = roster.filter(
    (r) =>
      r.userId === person?._id && r.status !== CpLiturgyRosterStatus.Cancelled,
  );
  const openDuties = roster.filter(
    (r) =>
      r.status === CpLiturgyRosterStatus.Cancelled &&
      allowedRoles.includes(r.position),
  );

  function findLitury(roster: CpLiturgyRoster) {
    const liturgyEvent = liturgyEvents.find(
      (l) => l._id === roster.liturgyEventId,
    );
    if (!liturgyEvent)
      return {
        errorComponent: (
          <AppTableRow className="text-sm text-red-700" key={roster._id}>
            Fehlerhafte Zuteilung
          </AppTableRow>
        ),
      };
    const liturgy = {
      ...liturgies[liturgyEvent.date].find(
        (l) => l.name === liturgyEvent.liturgyName,
      )!,
      date: liturgyEvent.date,
    };
    if (!liturgy)
      return {
        errorComponent: (
          <AppTableRow className="text-sm text-red-700" key={roster._id}>
            Liturgie nicht gefunden
          </AppTableRow>
        ),
      };
    return { liturgy, liturgyEvent };
  }

  if (myDuties.length === 0 && openDuties.length === 0) {
    return props.emptyState ?? null;
  }

  function rows(duties: CpLiturgyRoster[], action: "cancel" | "transfer") {
    return duties
      .map((roster) => ({ roster, ...findLitury(roster) }))
      .sort((a, b) =>
        (a.liturgyEvent?.date ?? "").localeCompare(b.liturgyEvent?.date ?? ""),
      )
      .map(({ roster, liturgyEvent, liturgy, errorComponent }) => {
        if (errorComponent) return errorComponent;
        const event = events.find((e) => e.id === liturgyEvent.eventId);
        return (
          <AppTableRow
            key={roster._id}
            className={cn(DUTY_COLUMNS, "items-center gap-y-1")}
          >
            <div>
              <div className="text-sm font-semibold">
                {formatDate(liturgyEvent.date)}
                {event && ` ${formatTime(event.start.dateTime)}`}
              </div>
              <div className="text-sm text-black/60">{event?.summary}</div>
            </div>
            <div className="col-start-1 flex flex-col items-start sm:col-start-auto">
              <div>{roleToString(roster.position)}</div>
              <ReadingLink
                roster={roster}
                liturgy={liturgy}
                className="h-auto p-0 text-sm"
              />
            </div>
            <div className="col-start-2 row-span-2 row-start-1 flex justify-end sm:col-start-auto sm:row-span-1 sm:row-start-auto">
              {action === "cancel" ? (
                <CancelDutyButton roster={roster} liturgyEvent={liturgyEvent} />
              ) : (
                <TransferDutyButton
                  roster={roster}
                  liturgyEvent={liturgyEvent}
                />
              )}
            </div>
          </AppTableRow>
        );
      });
  }

  return (
    <div className="flex flex-col gap-10">
      {myDuties.length > 0 && (
        <DutySection title="Eingeteilte Dienste">
          {rows(myDuties, "cancel")}
        </DutySection>
      )}
      {openDuties.length > 0 && (
        <DutySection
          title="Offene Dienste"
          description="Für diese Termine fehlt noch jemand. Wenn Sie einen Dienst übernehmen können, freuen wir uns riesig. Danke, dass Sie mithelfen!"
        >
          {rows(openDuties, "transfer")}
        </DutySection>
      )}
    </div>
  );
}

const DUTY_COLUMNS =
  "grid grid-cols-[1fr_auto] gap-x-4 sm:grid-cols-[9rem_1fr_8.5rem]";

/** Heading on the canvas, the duties as rows of a table (like the plan). */
function DutySection(props: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeading title={props.title} description={props.description} />
      <AppTable>
        <AppTableHeader className={cn("hidden sm:grid", DUTY_COLUMNS)}>
          <div>Termin</div>
          <div>Dienst</div>
        </AppTableHeader>
        {props.children}
      </AppTable>
    </section>
  );
}
