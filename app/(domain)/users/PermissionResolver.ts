import { CpPersonCompetences as C } from "@/util/cockpit.generated";

export function resolveCompetencesForGroup(group: string): C[] {
  const key: Record<C, boolean> = {
    [C.CalendarAdministration]: ["admin", "master"].includes(group),
    [C.Calendar]: ["admin", "master"].includes(group),
    [C.Reader]: ["admin", "master"].includes(group),
    [C.ReaderPlanning]: ["admin", "master"].includes(group),
    [C.CommunionMinister]: ["admin", "master"].includes(group),
    [C.CommunionMinisterPlanning]: ["admin", "master"].includes(group),
    [C.Sacristan]: ["admin", "master"].includes(group),
    [C.SacristanPlanning]: ["admin", "master"].includes(group),
    [C.Musician]: ["admin", "master"].includes(group),
    [C.MusicianPlanning]: ["admin", "master"].includes(group),
    [C.Editor]: ["admin", "master", "ArticleEditor"].includes(group),
    [C.WeeklyEditor]: ["admin", "master"].includes(group),
    [C.Instagram]: ["admin", "master"].includes(group),
    [C.MailEvents]: ["admin", "master"].includes(group),
  };
  return Object.entries(key)
    .filter(([_, value]) => value)
    .map(([competence]) => competence as C);
}
