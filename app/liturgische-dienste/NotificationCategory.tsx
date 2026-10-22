import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NotificationCheckbox } from "@/app/liturgische-dienste/NotificationCheckbox";
import { CpLiturgyRoster } from "@/util/cockpit.generated";

export function NotificationCategory(props: {
  roster: CpLiturgyRoster[];
  title: string;
  selected: string[];
  setSelected: (value: ((prevState: string[]) => string[]) | string[]) => void;
  mail: boolean;
}) {
  const positionRosterIds = props.roster.map((r) => r._id);
  const positionSelected = props.selected.filter((id) =>
    positionRosterIds.includes(id),
  );
  return (
    <>
      {props.roster.length > 0 && (
        <div className="my-3">
          <div className="font-semibold">{props.title}</div>
          <div className="my-2 flex items-center gap-1">
            <Checkbox
              id={props.title}
              checked={
                positionSelected.length === 0
                  ? false
                  : positionSelected.length === positionRosterIds.length
                    ? true
                    : "indeterminate"
              }
              onCheckedChange={(checked) =>
                props.setSelected([
                  ...props.selected.filter(
                    (id) => !positionRosterIds.includes(id),
                  ),
                  ...(!!checked ? positionRosterIds : []),
                ])
              }
            />
            <Label htmlFor={props.title}>Alle</Label>
          </div>
          {props.roster.map((r) => (
            <NotificationCheckbox
              key={r._id}
              roster={r}
              value={props.selected?.includes(r._id)}
              onChange={(value) =>
                props.setSelected((s) => [
                  ...s.filter((v) => v !== r._id),
                  ...(value ? [r._id] : []),
                ])
              }
              mail={props.mail}
            />
          ))}
        </div>
      )}
    </>
  );
}
