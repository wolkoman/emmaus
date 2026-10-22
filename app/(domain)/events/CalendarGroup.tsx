import { ReactNode } from "react";
import {
  PiBaby,
  PiBird,
  PiBook,
  PiBread,
  PiBriefcase,
  PiChurch,
  PiCross,
  PiFootprints,
  PiHandPalm,
  PiHandPeace,
  PiHandshake,
  PiHandsPraying,
  PiMoon,
  PiMusicNote,
  PiStar,
  PiTreeEvergreen,
  PiWine,
} from "react-icons/pi";

export enum CalendarGroup {
  Wallfahrt = "Wallfahrt",
  Messe = "Heilige Messe",
  Gebet = "Gebet & Bibel",
  Caritas = "Caritas",
  Kinder = "Kinder",
  Sakramente = "Sakramente",
  Gemeinschaft = "Gemeinschaft",
  Gottesdienst = "Gottesdienst",
  Weihnachten = "Weihnachten",
  Advent = "Advent",
  Invisible = "_",
  Jugend = "Jugend",
  Gremien = "Gremien",
  Chor = "Chor",
  Ostern = "Buß- und Osterzeit",
  LNDK = "Lange Nacht der Kirchen",
}

type CalendarEmojis = {
  [K in CalendarGroup]: string | ReactNode;
};

export const calendarGroupEmojis: CalendarEmojis = {
  [CalendarGroup.Wallfahrt]: <PiFootprints />,
  [CalendarGroup.Messe]: <PiWine />,
  [CalendarGroup.Gebet]: <PiBook />,
  [CalendarGroup.Caritas]: <PiHandPalm />,
  [CalendarGroup.Kinder]: <PiBaby />,
  [CalendarGroup.Sakramente]: <PiBird />,
  [CalendarGroup.Gemeinschaft]: <PiHandshake />,
  [CalendarGroup.Gottesdienst]: <PiChurch />,
  [CalendarGroup.Weihnachten]: <PiTreeEvergreen />,
  [CalendarGroup.Advent]: <PiStar />,
  [CalendarGroup.Invisible]: "",
  [CalendarGroup.Jugend]: <PiHandPeace />,
  [CalendarGroup.Gremien]: <PiBriefcase />,
  [CalendarGroup.Chor]: <PiMusicNote />,
  [CalendarGroup.Ostern]: <PiCross />,
  [CalendarGroup.LNDK]: <PiMoon />,
};
