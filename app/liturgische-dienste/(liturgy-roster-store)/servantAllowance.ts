import {
  CpLiturgyRosterPosition,
  CpPerson,
  CpPersonCompetences,
} from "@/util/cockpit.generated";

export const servantAllowance: {
  servant: CpPersonCompetences;
  planer: CpPersonCompetences;
  allowed: CpLiturgyRosterPosition[];
}[] = [
  {
    servant: CpPersonCompetences.Reader,
    planer: CpPersonCompetences.ReaderPlanning,
    allowed: [CpLiturgyRosterPosition.READER1, CpLiturgyRosterPosition.READER2],
  },
  {
    servant: CpPersonCompetences.Musician,
    planer: CpPersonCompetences.MusicianPlanning,
    allowed: [CpLiturgyRosterPosition.MUSICIAN],
  },
  {
    servant: CpPersonCompetences.Sacristan,
    planer: CpPersonCompetences.SacristanPlanning,
    allowed: [CpLiturgyRosterPosition.SACRISTAN],
  },
];

export function getAllowedRoles(
  user: CpPerson | null | undefined,
  type: "self" | "planner",
) {
  return servantAllowance
    .filter((allowance) =>
      user?.competences.includes(
        type === "self" ? allowance.servant : allowance.planer,
      ),
    )
    .flatMap((allowance) => allowance.allowed);
}
