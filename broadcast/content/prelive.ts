import { formatDay, formatTime, LIVE_TEXT, type LiveLang } from "../../app/carlo/i18n";
import { LIVESTREAM, MEETING_START } from "../../app/carlo/livestream";
import { TRAILER_CUES } from "./trailer";

const CELEBRANT = "Dr. Zvonko Brezovski";
const FILM_URL = "carloacutisfilm.it";

const PRELIVE_TEXT: Record<
  LiveLang,
  {
    celebrant: string;
    /** After the time, e.g. " Uhr". */
    timeSuffix: string;
    languages: string;
    welcome: string;
    place: string;
    filmTitle: string;
    filmAbout: string;
    /** Pause screen, before the meeting with Carlo's mother. */
    pauseTitle: string;
    meeting: string;
    pauseNote: string;
    /** End screen. */
    recordingNote: string;
  }
> = {
  en: {
    celebrant: "Celebrant",
    timeSuffix: "",
    languages: "The Mass will be celebrated in German, Croatian, Italian and English.",
    place: "Vienna, Austria",
    welcome: "We are delighted that Carlo's mother is celebrating with us here in Emmaus today.",
    filmTitle: "Film “Carlo Acutis: The Millennial Saint”",
    filmAbout: "The official documentary about his life, made with the Acutis family. Directed by Luca Salmaso.",
    pauseTitle: "We will be right back",
    meeting: "Meeting with Antonia Salzano Acutis, Carlo's mother",
    pauseNote: "The livestream continues here.",
    recordingNote: "The recording will be available at emmaus.wien/carlo.",
  },
  de: {
    celebrant: "Zelebrant",
    timeSuffix: " Uhr",
    languages: "Die Hl. Messe wird auf Deutsch, Kroatisch, Italienisch und Englisch gefeiert.",
    place: "Wien, Österreich",
    welcome: "Wir freuen uns sehr, dass die Mutter von Carlo heute in Emmaus mit uns feiert.",
    filmTitle: "Film „Der Millennial-Heilige“",
    filmAbout: "Der offizielle Dokumentarfilm über sein Leben, entstanden mit der Familie Acutis. Regie: Luca Salmaso.",
    pauseTitle: "Gleich geht es weiter",
    meeting: "Begegnung mit Antonia Salzano Acutis, der Mutter von Carlo",
    pauseNote: "Der Livestream geht hier weiter.",
    recordingNote: "Die Aufzeichnung finden Sie danach auf emmaus.wien/carlo.",
  },
  hr: {
    celebrant: "Predvoditelj",
    timeSuffix: " h",
    languages: "Misa će se slaviti na njemačkom, hrvatskom, talijanskom i engleskom jeziku.",
    place: "Beč, Austrija",
    welcome: "Jako nam je drago što Carlova majka danas slavi s nama u Emmausu.",
    filmTitle: "Film „Carlo Acutis: The Millennial Saint“",
    filmAbout: "Službeni dokumentarni film o njegovu životu, snimljen u suradnji s obitelji Acutis. Redatelj: Luca Salmaso.",
    pauseTitle: "Uskoro nastavljamo",
    meeting: "Susret s Antonijom Salzano Acutis, Carlovom majkom",
    pauseNote: "Prijenos uživo nastavlja se ovdje.",
    recordingNote: "Snimka će biti dostupna na emmaus.wien/carlo.",
  },
  it: {
    celebrant: "Celebrante",
    timeSuffix: "",
    languages: "La Messa sarà celebrata in tedesco, croato, italiano e inglese.",
    place: "Vienna, Austria",
    welcome: "Siamo molto felici che la mamma di Carlo celebri oggi con noi a Emmaus.",
    filmTitle: "Film “Carlo Acutis. Il giovane santo”",
    filmAbout: "Il documentario ufficiale sulla sua vita, realizzato con la famiglia Acutis. Regia di Luca Salmaso.",
    pauseTitle: "Torniamo subito",
    meeting: "Incontro con Antonia Salzano Acutis, la mamma di Carlo",
    pauseNote: "La diretta continua qui.",
    recordingNote: "La registrazione sarà disponibile su emmaus.wien/carlo.",
  },
};

/** The left column cycles through English and these; the film block shows English with one of these beneath. */
const ROTATION: LiveLang[] = ["de", "hr", "it"];

/** A UTC time as "HH:MM" in Vienna. */
function viennaTime(utc: string) {
  return new Date(utc).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
}

/** The Mass start, the initial broadcast start. */
export function defaultBroadcastTime() {
  return viennaTime(LIVESTREAM.start);
}

/** The meeting with Carlo's mother, the initial end of the pause. */
export function defaultResumeTime() {
  return viennaTime(MEETING_START);
}

/** Italian and Croatian dates start with a lowercase weekday; on its own line it needs a capital. */
function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function preliveContent() {
  const text = Object.fromEntries(
    (["en", ...ROTATION] as LiveLang[]).map((lang) => {
      const t = PRELIVE_TEXT[lang];
      return [
        lang,
        {
          title: LIVE_TEXT[lang].programme.mass,
          date: capitalize(`${formatDay(LIVESTREAM.start, lang)}, ${formatTime(LIVESTREAM.start, lang)}${t.timeSuffix}`),
          celebrant: `${t.celebrant}: ${CELEBRANT}`,
          welcome: t.welcome,
          place: t.place,
          languages: t.languages,
          filmTitle: t.filmTitle,
          filmAbout: t.filmAbout,
          pauseTitle: t.pauseTitle,
          pauseTime: `${formatTime(MEETING_START, lang)}${t.timeSuffix}`,
          pauseMeeting: t.meeting,
          pauseNote: t.pauseNote,
          endTitle: LIVE_TEXT[lang].thanks,
          endRecording: t.recordingNote,
        },
      ];
    }),
  );
  return {
    rotation: ROTATION,
    parish: "Pfarre Emmaus am Wienerberg",
    text,
    // Shown in English only; the overlay fills in the minutes.
    startingIn: "Live broadcast is starting in {minutes}",
    startingSoon: "Live broadcast is starting shortly",
    resumingIn: "The broadcast continues in {minutes}",
    resumingSoon: "The broadcast continues shortly",
    ended: "Thank you for watching",
    filmMore: `More information: ${FILM_URL}`,
    // The trailer is narrated in German, so the other Mass languages get subtitles.
    trailer: {
      languages: (["hr", "it", "en"] as const).map((lang) => ({ lang, name: LIVE_TEXT[lang].languageName })),
      cues: TRAILER_CUES,
    },
  };
}
