import { CpLiturgyRosterPosition } from "@/util/cockpit.generated";

export function roleToString(role: CpLiturgyRosterPosition) {
  return {
    [CpLiturgyRosterPosition.READER1]: "1. Lektor:in",
    [CpLiturgyRosterPosition.READER2]: "2. Lektor:in",
    [CpLiturgyRosterPosition.SACRISTAN]: "Mesnerin",
    [CpLiturgyRosterPosition.MUSICIAN]: "Musikalische Gestaltung",
  }[role];
}

export const allRoles = [
  CpLiturgyRosterPosition.READER1,
  CpLiturgyRosterPosition.READER2,
  CpLiturgyRosterPosition.SACRISTAN,
  CpLiturgyRosterPosition.MUSICIAN,
];
