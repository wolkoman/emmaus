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
import { PiHandPalm, PiSpinner } from "react-icons/pi";
import { roleToString } from "@/domain/service/Service";
import { formatDate } from "@/app/(shared)/Localization";
import React from "react";

export function CancelDutyButton(props: {
  roster: CpLiturgyRoster;
  liturgyEvent: CpLiturgyEvent;
}) {
  const { cancel } = useLiturgyRoster((state) => state);
  const loading = useLoading();

  function _cancel() {
    loading.whileLoading(cancel(props.liturgyEvent._id, props.roster.position));
  }

  return (
    <Dialog open={loading.loading ? true : undefined}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex gap-1 text-base">
          <PiHandPalm /> Absagen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Dienst Absagen</DialogTitle>
        <DialogDescription>
          Wollen Sie den Dienst "{roleToString(props.roster.position)}" am{" "}
          {formatDate(props.liturgyEvent.date)} wirklich absagen?
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="destructive"
            className="flex gap-1"
            onClick={_cancel}
            disabled={loading.loading}
          >
            {loading.loading && <PiSpinner className="animate-spin" />} Dienst
            absagen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
