import { useUserStore } from "@/store/UserStore";
import { getAllowedRoles } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";

import { LiturgyPersonSelector } from "@/app/liturgische-dienste/LiturgyPersonSelector";
import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { CpLiturgyRosterPosition } from "@/util/cockpit.generated";

export function LiturgyJobsView(props: {
  label: string;
  liturgyEventId: string;
  positions: CpLiturgyRosterPosition[];
}) {
  const roster = useLiturgyRoster((state) =>
    state.roster.filter(
      (r) =>
        r.liturgyEventId === props.liturgyEventId &&
        props.positions?.includes(r.position),
    ),
  );
  const isPlanned = roster.length > 0;
  const allowedRoles = useUserStore((state) =>
    getAllowedRoles(state.person, "planner"),
  );
  const isPlanner = props.positions.some((r) => allowedRoles.includes(r));
  return isPlanned || isPlanner ? (
    <div className="flex min-w-0 flex-col gap-1">
      {/* Column headers name the role on wide screens (see LiturgyEvent). */}
      <div className="text-xs text-black/50 lg:hidden">{props.label}</div>
      {props.positions.map((p) => (
        <LiturgyPersonSelector
          key={p}
          position={p}
          roster={roster.find((r) => r.position === p)}
          liturgyEventId={props.liturgyEventId}
        />
      ))}
    </div>
  ) : (
    <div />
  );
}
