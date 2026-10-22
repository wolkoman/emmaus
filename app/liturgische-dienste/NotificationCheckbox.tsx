import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/app/(shared)/Localization";
import React, { useEffect } from "react";
import { CpLiturgyRoster } from "@/util/cockpit.generated";

export function NotificationCheckbox(props: {
  value: boolean;
  onChange: (value: boolean) => void;
  mail: boolean;
  roster: CpLiturgyRoster;
}) {
  const [persons, liturgyEvents] = useLiturgyRoster((state) => [
    state.persons,
    state.liturgyEvents,
  ]);
  const person = persons.find((p) => p._id === props.roster.userId);
  const disabled = props.mail && !person?.email;
  useEffect(() => {
    if (disabled && props.value) props.onChange(false);
  }, [disabled, props.value]);
  return (
    <div className="my-2 flex items-center gap-1">
      <Checkbox
        id={props.roster._id}
        disabled={disabled}
        checked={props.value}
        onCheckedChange={(checked) => props.onChange(!!checked)}
      />
      <Label htmlFor={props.roster._id}>
        {formatDate(
          liturgyEvents.find((l) => l._id === props.roster.liturgyEventId)!
            .date,
          {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          },
        )}{" "}
        {person?.name}
      </Label>
    </div>
  );
}
