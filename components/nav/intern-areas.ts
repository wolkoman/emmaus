import { Links } from "@/app/(shared)/Links";
import { CpPerson, CpPersonCompetences } from "@/util/cockpit.generated";

export interface InternArea {
  icon: string;
  href: string;
  title: string;
  slogan: string;
}

/** The internal areas a person may open, shared by the navbar and /intern. */
export function internAreas(person: CpPerson): InternArea[] {
  const has = (c: CpPersonCompetences) => person.competences.includes(c);
  const areas: (InternArea | false)[] = [
    {
      icon: "PiTable",
      href: Links.DiensteUebersicht,
      title: "Liturgische Dienste",
      slogan: "Gemeinsam den Glauben im Gottesdienst leben",
    },
    has(CpPersonCompetences.WeeklyEditor) && {
      icon: "PiCalendarDots",
      href: Links.MonatsblattEditor,
      title: "Monatsblatt Editor",
      slogan: "Flyer und Plakat für den Monat gestalten",
    },
    has(CpPersonCompetences.Editor) && {
      icon: "PiNewspaperClipping",
      href: Links.Projektplattform,
      title: "Redaktion",
      slogan: "Verkündigung im Emmausboten",
    },
    {
      icon: "PiMegaphone",
      href: Links.Verlautbarungen,
      title: "Verlautbarungen",
      slogan: "Termine und Ankündigungen zum Vorlesen",
    },
    {
      icon: "PiFiles",
      href: Links.Resourcen,
      title: "Resourcen",
      slogan: "Logos, Farben und Vorlagen unserer Pfarre",
    },
    {
      icon: "PiShieldCheck",
      href: Links.Sicherheit,
      title: "Sicherheit",
      slogan: "Passwort und Passkeys",
    },
    !!person.admin && {
      icon: "PiGear",
      href: "https://db.emmaus.wien/_/",
      title: "Pocketbase",
      slogan: "Pocketbase ist unser Datenbanksystem",
    },
  ];
  return areas.filter((a): a is InternArea => a !== false);
}
