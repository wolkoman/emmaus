import { CalendarEvent } from "@/domain/events/EventMapper";
import { roleToString } from "@/domain/service/Service";
import { CpLiturgyRosterStatus } from "@/util/cockpit.generated";
import { SanitizeHTML } from "../SanitizeHtml";

export function EventDescription(props: {
  event: Partial<CalendarEvent>;
  liturgyNameDesktopOnly?: boolean;
}) {
  return (
    <div className="text-sm">
      {props.event.liturgyName && (
        <div
          className={`mb-1 italic ${props.liturgyNameDesktopOnly ? "hidden lg:block" : ""}`}
        >
          {props.event.liturgyName}
        </div>
      )}
      <div className="grow">
        {props.event.mainPerson && `mit ${props.event.mainPerson}`}
        <SanitizeHTML
          html={props.event.description?.replaceAll("\n", "<br>") ?? ""}
        ></SanitizeHTML>
      </div>
      <div className="mt-2">
        {props.event.roster?.map((roster) => {
          const cancelled = roster?.status === CpLiturgyRosterStatus.Cancelled;
          return (
            <div key={roster.position}>
              {roleToString(roster.position)}:{" "}
              <span className={cancelled ? "line-through" : ""}>
                {roster.userName}
              </span>{" "}
              {cancelled && " (abgesagt)"}
              {roster.status === CpLiturgyRosterStatus.Assigned &&
                " (nicht informiert)"}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const EventDate = (props: { date: string }) => {
  const date = new Date(props.date + "T02:00");
  return (
    <>
      <div className="font-semibold lg:hidden">
        {date.toLocaleDateString("de-AT", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        })}
      </div>
      <div className={`hidden flex-col lg:flex`}>
        <div className={`font-semibold`}>
          {date
            .toLocaleDateString("de-AT", { weekday: "short" })
            .replace(".", "")}
          ,{" "}
          {date.toLocaleDateString("de-AT", { day: "numeric", month: "long" })}
        </div>
      </div>
    </>
  );
};
