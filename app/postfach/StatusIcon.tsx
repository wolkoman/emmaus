import { MailStatus } from "@/domain/mail/imap";
import { PiArrowBendUpLeft, PiCheck, PiCircleFill } from "react-icons/pi";

export const STATUS_LABELS: Record<MailStatus, string> = {
  offen: "Wartet auf Antwort",
  beantwortet: "Beantwortet",
  erledigt: "Ohne Antwort erledigt",
};

export function StatusIcon(props: { status: MailStatus }) {
  const title = STATUS_LABELS[props.status];
  switch (props.status) {
    case "offen":
      return (
        <PiCircleFill className="text-emmaus size-2 shrink-0" title={title} />
      );
    case "beantwortet":
      return (
        <PiArrowBendUpLeft className="shrink-0 text-black/50" title={title} />
      );
    case "erledigt":
      return <PiCheck className="shrink-0 text-black/50" title={title} />;
  }
}
