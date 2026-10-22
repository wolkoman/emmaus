import {
  PiBellBold,
  PiCheckBold,
  PiChecksBold,
  PiSpinner,
} from "react-icons/pi";
import * as React from "react";
import { CpLiturgyRosterStatus } from "@/util/cockpit.generated";

export function LiturgyPerson(props: {
  isOverriding?: boolean;
  override?: string;
  name?: string;
  status?: CpLiturgyRosterStatus;
  reminderSent?: string;
  showPlaceholder?: boolean;
}) {
  return (
    <>
      <span className="min-w-0 truncate">
        {props.isOverriding
          ? (props.override ?? "Niemand")
          : (props.name ?? (
              <span className="opacity-40">
                {props.showPlaceholder ? "Person wählen..." : "offen"}
              </span>
            ))}
      </span>
      {!props.isOverriding &&
        props.status === CpLiturgyRosterStatus.Informed &&
        (props.reminderSent ? (
          <PiChecksBold
            role="img"
            aria-label="erinnert"
            title={`erinnert am ${formatReminderSent(props.reminderSent)}`}
            className="shrink-0 text-lg text-green-600"
          />
        ) : (
          <PiCheckBold className="shrink-0 text-lg text-green-600" />
        ))}
      {!props.isOverriding &&
        props.status === CpLiturgyRosterStatus.Assigned && (
          <PiBellBold className="shrink-0 text-lg text-blue-600" />
        )}
      {!props.isOverriding &&
        props.status === CpLiturgyRosterStatus.Cancelled && (
          // Same dot as the status legend next to the plan.
          <span
            role="img"
            aria-label="abgesagt"
            title="abgesagt"
            className="size-2.5 shrink-0 rounded-full bg-red-600"
          />
        )}
      {props.isOverriding ? (
        <PiSpinner className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
      ) : (
        <></>
      )}
    </>
  );
}

function formatReminderSent(value: string) {
  // PB returns "YYYY-MM-DD HH:mm:ss.sssZ", which Safari can't parse without the "T".
  return new Date(value.replace(" ", "T")).toLocaleString("de-AT", {
    timeZone: "Europe/Vienna",
    dateStyle: "short",
    timeStyle: "short",
  });
}
