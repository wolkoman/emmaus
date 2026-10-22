import { CpLiturgyEvent, CpLiturgyRoster } from "@/util/cockpit.generated";
import { useLiturgyRoster } from "@/app/liturgische-dienste/(liturgy-roster-store)/liturgy-roster-store";
import { useLoading } from "@/app/(shared)/UseLoading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PiArrowArcLeft, PiSpinner } from "react-icons/pi";
import { roleToString } from "@/domain/service/Service";
import { formatDate } from "@/app/(shared)/Localization";
import React from "react";

export function TransferDutyButton(props: {
  roster: CpLiturgyRoster;
  liturgyEvent: CpLiturgyEvent;
}) {
  const { transfer } = useLiturgyRoster((state) => state);
  const loading = useLoading();

  function _transfer() {
    loading.whileLoading(
      transfer(props.liturgyEvent._id, props.roster.position),
    );
  }

  return (
    <Dialog open={loading.loading ? true : undefined}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex gap-1 text-base">
          <PiArrowArcLeft /> Übernehmen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Dienst Übernehmen</DialogTitle>
        <DialogDescription>
          Wollen Sie den Dienst "{roleToString(props.roster.position)}" am{" "}
          {formatDate(props.liturgyEvent.date)} übernehmen?
        </DialogDescription>
        <DialogFooter>
          <Button
            className="flex gap-1"
            onClick={_transfer}
            disabled={loading.loading}
          >
            {loading.loading && <PiSpinner className="animate-spin" />} Dienst
            übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
