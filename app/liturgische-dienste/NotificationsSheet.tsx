import { useLoading } from "@/app/(shared)/UseLoading";
import { cn } from "@/app/(shared)/utils";
import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { getAllowedRoles } from "@/app/liturgische-dienste/(liturgy-roster-store)/servantAllowance";
import { NotificationCategory } from "@/app/liturgische-dienste/NotificationCategory";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { roleToString } from "@/domain/service/Service";
import { useUserStore } from "@/store/UserStore";
import {
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
} from "@/util/cockpit.generated";
import { useMemo, useState } from "react";
import { PiSpinner } from "react-icons/pi";

export function NotificationsSheet() {
  const [roster, events, _inform] = useLiturgyRoster((state) => [
    state.roster.filter((r) => r.status === CpLiturgyRosterStatus.Assigned),
    state.events,
    state.inform,
  ]);
  const jobs = useMemo(() => {
    return {
      reading: roster.filter((r) => r.position.startsWith("READER")),
      musician: roster.filter(
        (r) => r.position === CpLiturgyRosterPosition.MUSICIAN,
      ),
      sacristan: roster.filter(
        (r) => r.position === CpLiturgyRosterPosition.SACRISTAN,
      ),
    };
  }, [roster]);
  const { loading, whileLoading } = useLoading();
  const [selected, setSelected] = useState<string[]>([]);
  const [mail, setMail] = useState(true);
  const allowedRoles = useUserStore((user) =>
    getAllowedRoles(user.person, "planner"),
  );

  return (
    <SheetContent
      /*closable={!loading}*/
      className={cn("flex flex-col", loading && "pointer-events-none")}
      onInteractOutside={loading ? (e) => e.preventDefault() : undefined}
    >
      <SheetHeader>
        <SheetTitle>Benachrichtigen</SheetTitle>
        <SheetDescription>
          Informiere Personen über die Diensteinteilung. Mittels Mails können
          Personen automatisch informiert werden, andernfalls müssen sie
          persönlich informiert werden.
        </SheetDescription>
      </SheetHeader>
      <ScrollArea className="min-h-0 flex-1 px-4">
        {allowedRoles.includes(CpLiturgyRosterPosition.READER1) && (
          <NotificationCategory
            title="Lektor:innen"
            roster={jobs.reading}
            selected={selected}
            setSelected={setSelected}
            mail={mail}
          />
        )}
        {allowedRoles.includes(CpLiturgyRosterPosition.MUSICIAN) && (
          <NotificationCategory
            title={roleToString(CpLiturgyRosterPosition.MUSICIAN)}
            roster={jobs.musician}
            selected={selected}
            setSelected={setSelected}
            mail={mail}
          />
        )}
        {allowedRoles.includes(CpLiturgyRosterPosition.SACRISTAN) && (
          <NotificationCategory
            title={roleToString(CpLiturgyRosterPosition.SACRISTAN)}
            roster={jobs.sacristan}
            selected={selected}
            setSelected={setSelected}
            mail={mail}
          />
        )}
      </ScrollArea>
      <SheetFooter className="flex flex-row">
        <Button
          type="submit"
          className="flex grow gap-1"
          disabled={selected.length === 0 || loading}
          onClick={() => whileLoading(_inform(selected, mail))}
        >
          {loading && <PiSpinner className="animate-spin" />}
          {mail ? "E-Mails senden" : "Persönlich benachrichtigen"}
        </Button>
        <div className="my-1 flex flex-col items-center gap-1">
          <Switch id="mail" checked={mail} onCheckedChange={setMail} />
          <Label htmlFor="mail">Via E-Mail</Label>
        </div>
      </SheetFooter>
    </SheetContent>
  );
}
