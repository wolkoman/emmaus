import { CpPerson, CpPersonCompetences } from "@/util/cockpit.generated";

export function isLiturgyUser(user: CpPerson | null | undefined) {
  if (user === null || user === undefined) return false;
  return (
    user.competences.includes(CpPersonCompetences.Reader) ||
    user.competences.includes(CpPersonCompetences.Musician) ||
    user.competences.includes(CpPersonCompetences.Sacristan)
  );
}

export function isLiturgyPlaner(user: CpPerson | null | undefined) {
  if (user === null || user === undefined) return false;
  return (
    user.competences.includes(CpPersonCompetences.ReaderPlanning) ||
    user.competences.includes(CpPersonCompetences.MusicianPlanning) ||
    user.competences.includes(CpPersonCompetences.SacristanPlanning)
  );
}
