export const LIVE_LANGS = ["de", "en", "it", "hr"] as const;
export type LiveLang = (typeof LIVE_LANGS)[number];

/** Bare /carlo (and the old /live) redirects to one of these by browser language (see proxy.ts). */
export function carloPath(lang: LiveLang) {
  return `/carlo/${lang}`;
}

/** The best language we offer for an Accept-Language header, German if none matches. */
export function liveLangFor(acceptLanguage: string | null): LiveLang {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        base: tag.split("-")[0].toLowerCase(),
        q: q ? Number(q.trim().slice(2)) : 1,
      };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);
  const match = ranked.find((entry) =>
    (LIVE_LANGS as readonly string[]).includes(entry.base),
  );
  return (match?.base as LiveLang | undefined) ?? "de";
}

type Unit = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

type LiveText = {
  locale: string;
  languageName: string;
  heading: string;
  /** The poster's headline. */
  motto: string;
  lead: string;
  /** Highlighted where it appears in `lead`. */
  mother: string;
  live: string;
  programme: {
    mass: string;
    massNote: string;
    meeting: string;
    film: string;
    parish: string;
    cinema: string;
  };
  tickets: { link: string; soon: string };
  livestreamHeading: string;
  units: { days: Unit; hours: Unit; minutes: Unit; seconds: Unit };
  notYet: string;
  startsHere: string;
  startingSoon: string;
  openStream: string;
  thanks: string;
  recording: string;
  /** Shown site-wide to visitors whose browser prefers this language; German has none. */
  banner?: { text: string; link: string };
};

export const LIVE_TEXT: Record<LiveLang, LiveText> = {
  de: {
    locale: "de-AT",
    languageName: "Deutsch",
    heading: "Hl. Carlo Acutis",
    motto: "Jesus erkennen mit dem Heiligen Carlo Acutis",
    lead: "Seine Mutter Antonia Salzano Acutis kommt zu uns in die Pfarre Emmaus!",
    mother: "Antonia Salzano Acutis",
    live: "Live",
    programme: {
      mass: "Hl. Messe zu Ehren des Heiligen Carlo Acutis",
      massNote:
        "Auf Deutsch, Kroatisch, Italienisch und Englisch. Auch im Livestream, siehe unten.",
      meeting: "Begegnung mit seiner Mutter",
      film: "Premiere des Films über Carlo, mit Ansprache seiner Mutter Antonia",
      parish: "Pfarre Emmaus am Wienerberg, Tesarekplatz 2, 1100 Wien",
      cinema: "Kino Hollywood Megaplex Gasometer, Guglgasse 11, 1110 Wien",
    },
    tickets: {
      link: "Kinokarten kaufen",
      soon: "Wird freigeschaltet, sobald Karten erhältlich sind",
    },
    livestreamHeading: "Livestream der Hl. Messe",
    units: {
      days: { one: "Tag", other: "Tage" },
      hours: { one: "Stunde", other: "Stunden" },
      minutes: { one: "Minute", other: "Minuten" },
      seconds: { one: "Sekunde", other: "Sekunden" },
    },
    notYet: "Der Stream ist noch nicht verfügbar",
    startsHere: "Er startet hier kurz vor Beginn der Hl. Messe.",
    startingSoon: "Der Livestream beginnt in Kürze",
    openStream: "Stream in neuem Fenster öffnen",
    thanks: "Danke fürs Mitfeiern",
    recording: "Aufzeichnung ansehen",
  },
  en: {
    locale: "en-GB",
    languageName: "English",
    heading: "Saint Carlo Acutis",
    motto: "Recognising Jesus with Saint Carlo Acutis",
    lead: "His mother, Antonia Salzano Acutis, is coming to the Emmaus parish in Vienna!",
    mother: "Antonia Salzano Acutis",
    live: "Live",
    programme: {
      mass: "Holy Mass in honour of Saint Carlo Acutis",
      massNote:
        "In German, Croatian, Italian and English. Also streamed live below.",
      meeting: "Meeting with his mother",
      film: "Premiere of the film about Carlo, with an address by his mother Antonia",
      parish: "Emmaus parish church, Tesarekplatz 2, 1100 Vienna",
      cinema: "Hollywood Megaplex Gasometer cinema, Guglgasse 11, 1110 Vienna",
    },
    tickets: {
      link: "Buy cinema tickets",
      soon: "Available as soon as tickets go on sale",
    },
    livestreamHeading: "Livestream of the Holy Mass",
    units: {
      days: { one: "Day", other: "Days" },
      hours: { one: "Hour", other: "Hours" },
      minutes: { one: "Minute", other: "Minutes" },
      seconds: { one: "Second", other: "Seconds" },
    },
    notYet: "The stream is not available yet",
    startsHere: "It will start here shortly before Mass begins.",
    startingSoon: "The livestream is about to start",
    openStream: "Open the stream in a new window",
    thanks: "Thank you for celebrating with us",
    recording: "Watch the recording",
    banner: {
      text: "On Saturday, 21 November, at 16:00 we will livestream a Holy Mass with the mother of Saint Carlo Acutis, celebrated partly in English.",
      link: "Livestream, cinema tickets and all details",
    },
  },
  it: {
    locale: "it-IT",
    languageName: "Italiano",
    heading: "San Carlo Acutis",
    motto: "Riconoscere Gesù con San Carlo Acutis",
    lead: "Sua madre, Antonia Salzano Acutis, viene a trovarci nella parrocchia Emmaus di Vienna!",
    mother: "Antonia Salzano Acutis",
    live: "In diretta",
    programme: {
      mass: "Santa Messa in onore di San Carlo Acutis",
      massNote:
        "In tedesco, croato, italiano e inglese. Anche in diretta streaming qui sotto.",
      meeting: "Incontro con sua madre",
      film: "Prima del film su Carlo, con un intervento di sua madre Antonia",
      parish: "Chiesa Emmaus, Tesarekplatz 2, 1100 Vienna",
      cinema: "Cinema Hollywood Megaplex Gasometer, Guglgasse 11, 1110 Vienna",
    },
    tickets: {
      link: "Acquista i biglietti del cinema",
      soon: "Disponibile non appena i biglietti saranno in vendita",
    },
    livestreamHeading: "Diretta streaming della Santa Messa",
    units: {
      days: { one: "giorno", other: "giorni" },
      hours: { one: "ora", other: "ore" },
      minutes: { one: "minuto", other: "minuti" },
      seconds: { one: "secondo", other: "secondi" },
    },
    notYet: "La diretta non è ancora disponibile",
    startsHere: "Inizierà qui poco prima della Messa.",
    startingSoon: "La diretta sta per iniziare",
    openStream: "Apri la diretta in una nuova finestra",
    thanks: "Grazie per aver celebrato con noi",
    recording: "Guarda la registrazione",
    banner: {
      text: "Sabato 21 novembre alle 16:00 trasmetteremo in diretta una Santa Messa con la madre di San Carlo Acutis, celebrata in parte in italiano.",
      link: "Diretta, biglietti del cinema e tutte le informazioni",
    },
  },
  hr: {
    locale: "hr-HR",
    languageName: "Hrvatski",
    heading: "Sveti Carlo Acutis",
    motto: "Prepoznati Isusa sa svetim Carlom Acutisom",
    lead: "Njegova majka Antonia Salzano Acutis dolazi u župu Emmaus u Beču!",
    mother: "Antonia Salzano Acutis",
    live: "Uživo",
    programme: {
      mass: "Sveta misa u čast svetog Carla Acutisa",
      massNote:
        "Na njemačkom, hrvatskom, talijanskom i engleskom jeziku. Prenosi se i uživo, vidi niže.",
      meeting: "Susret s njegovom majkom",
      film: "Premijera filma o Carlu, uz obraćanje njegove majke Antonije",
      parish: "Crkva Emmaus, Tesarekplatz 2, 1100 Beč",
      cinema: "Kino Hollywood Megaplex Gasometer, Guglgasse 11, 1110 Beč",
    },
    tickets: {
      link: "Kupi ulaznice za kino",
      soon: "Bit će dostupno čim ulaznice budu u prodaji",
    },
    livestreamHeading: "Prijenos svete mise uživo",
    units: {
      days: { one: "dan", few: "dana", other: "dana" },
      hours: { one: "sat", few: "sata", other: "sati" },
      minutes: { one: "minuta", few: "minute", other: "minuta" },
      seconds: { one: "sekunda", few: "sekunde", other: "sekundi" },
    },
    notYet: "Prijenos još nije dostupan",
    startsHere: "Započet će ovdje nešto prije početka mise.",
    startingSoon: "Prijenos uživo uskoro počinje",
    openStream: "Otvori prijenos u novom prozoru",
    thanks: "Hvala što ste slavili s nama",
    recording: "Pogledajte snimku",
    banner: {
      text: "U subotu, 21. studenoga, u 16 sati uživo prenosimo svetu misu, dijelom na hrvatskom jeziku, s majkom svetog Carla Acutisa.",
      link: "Prijenos uživo, ulaznice za kino i sve informacije",
    },
  },
};

export function formatDay(start: string, lang: LiveLang) {
  return new Date(start).toLocaleDateString(LIVE_TEXT[lang].locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Vienna",
  });
}

/** The poster's big date, split into weekday and day with month. */
export function formatDateParts(start: string, lang: LiveLang) {
  const date = new Date(start);
  const { locale } = LIVE_TEXT[lang];
  const timeZone = "Europe/Vienna";
  return {
    weekday: date.toLocaleDateString(locale, { weekday: "long", timeZone }),
    day: date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      timeZone,
    }),
  };
}

export function formatTime(iso: string, lang: LiveLang) {
  const time = new Date(iso).toLocaleTimeString(LIVE_TEXT[lang].locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Vienna",
  });
  return time;
}

export function unitLabel(unit: Unit, value: number, lang: LiveLang) {
  const rule = new Intl.PluralRules(LIVE_TEXT[lang].locale).select(value);
  return unit[rule] ?? unit.other;
}
