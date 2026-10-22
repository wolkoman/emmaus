import { CpLiturgyRoster } from "@/util/cockpit.generated";

export enum EventLoadAccess {
  PUBLIC = "PUBLIC",
  PRIVATE_ACCESS = "PRIVATE_ACCESS",
  READER = "READER",
  WEEKLY = "WEEKLY",
}

export type EventLoadOptions =
  | { access: EventLoadAccess.PUBLIC }
  | {
      access: EventLoadAccess.WEEKLY;
      timeFrame?: { min: Date; max: Date };
    }
  | {
      access: EventLoadAccess.PRIVATE_ACCESS;
      timeFrame?: { min: Date; max: Date };
    }
  | { access: EventLoadAccess.READER; ids: string[] };
