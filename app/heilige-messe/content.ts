const photo = (folder: string, image: string) =>
  `https://api.emmaus.wien/files/folder_${folder}/full/img_${image}.jpg`;

export const PHOTOS = {
  altar: photo("6a21c02de166f1.87502911", "6a21c063b4c1b0.75856741"),
  music: photo("6a21c02de166f1.87502911", "6a21c04eca2115.19528953"),
  monstrance: photo("6a21c02de166f1.87502911", "6a21c05317c401.09575838"),
  crucifix: photo("6a21c02de166f1.87502911", "6a21c031caa536.77999798"),
  chalice: photo("6a21c02de166f1.87502911", "6a21c05348a228.17612855"),
  eucharist: photo("68c6de2b83c4b1.18712258", "68c6de2c274dc9.80991044"),
  church: photo("6a21c02de166f1.87502911", "6a21c045aa8fc4.01863380"),
  lector: photo("68c6de2b83c4b1.18712258", "68c6de2fef29d7.88200666"),
  peace: photo("68c6de2b83c4b1.18712258", "68c6de2e146fc8.89918687"),
  hands: photo("68c6de2b83c4b1.18712258", "68c6de2e3b2e31.94677027"),
  praying: photo("68c6de2b83c4b1.18712258", "68c6de30e49a08.59817509"),
};

export const PILLARS = [
  {
    title: "Begegnung",
    text: "In den gewandelten Gaben von Brot und Wein ist Jesus Christus wirklich gegenwärtig, mitten unter uns.",
    image: PHOTOS.monstrance,
  },
  {
    title: "Einkehr",
    text: "Wir hören Gottes Wort, beten und kommen zur Ruhe. Die Messe schenkt Kraft für den Alltag.",
    image: PHOTOS.praying,
  },
  {
    title: "Gemeinschaft",
    text: "Wir versammeln uns als Gemeinde, loben Gott gemeinsam und beten für die Anliegen der Welt.",
    image: PHOTOS.peace,
  },
];

export type MassPart = {
  id: string;
  title: string;
  image: string;
  text: string;
  moments: string[];
};

export const MASS_PARTS: MassPart[] = [
  {
    id: "eroeffnung",
    title: "Eröffnung",
    image: PHOTOS.music,
    text: "Wir kommen aus unserem Alltag, mit allem, was uns bewegt, und werden zu einer Gemeinschaft vor Gott. Mit dem Kreuzzeichen stellen wir die Feier unter seinen Namen, im Kyrie bitten wir um sein Erbarmen, im Gloria loben wir ihn.",
    moments: [
      "Einzug und Eröffnungslied",
      "Kreuzzeichen und Begrüßung",
      "Kyrie: „Herr, erbarme dich“",
      "Gloria",
      "Tagesgebet",
    ],
  },
  {
    id: "wort",
    title: "Wortgottesdienst",
    image: PHOTOS.lector,
    text: "Wie Jesus den Emmaus-Jüngern die Schrift erschlossen hat, so spricht Gott heute zu uns. Wir hören Lesungen aus dem Alten und Neuen Testament und das Evangelium. Die Predigt übersetzt das Gehörte in unser Leben.",
    moments: [
      "Erste Lesung und Antwortpsalm",
      "Zweite Lesung",
      "Halleluja und Evangelium",
      "Predigt",
      "Glaubensbekenntnis",
      "Fürbitten",
    ],
  },
  {
    id: "eucharistie",
    title: "Eucharistiefeier",
    image: PHOTOS.eucharist,
    text: "Brot und Wein werden zum Altar gebracht. Im Hochgebet spricht der Priester die Worte Jesu vom Letzten Abendmahl, und Christus wird in den Gaben gegenwärtig. Wir beten das Vaterunser, reichen einander den Frieden und empfangen die Kommunion.",
    moments: [
      "Gabenbereitung und Kollekte",
      "Hochgebet mit dem „Heilig“",
      "Wandlung",
      "Vaterunser und Friedensgruß",
      "Lamm Gottes",
      "Kommunion",
    ],
  },
  {
    id: "sendung",
    title: "Segen und Sendung",
    image: PHOTOS.hands,
    text: "Nach dem Schlussgebet und den Verlautbarungen segnet uns der Priester. Dann werden wir gesendet: Was wir gefeiert haben, tragen wir hinaus in unseren Alltag, so wie die Emmaus-Jünger, die noch in derselben Stunde nach Jerusalem aufbrachen.",
    moments: [
      "Schlussgebet",
      "Verlautbarungen",
      "Segen",
      "Entlassung und Auszug",
    ],
  },
];

export const TIPS = [
  {
    title: "Liederbuch mitnehmen",
    text: "Am Eingang liegen Liederbücher auf. Die Liednummern stehen meist auf der Säule neben dem Altar.",
  },
  {
    title: "Dem Ablauf folgen",
    text: "Nicht alles muss vertraut sein. Schauen Sie sich den Ablauf oben an oder fragen Sie einfach jemanden neben sich.",
  },
  {
    title: "Mitbeten",
    text: "In den Fürbitten beten wir für viele Anliegen. Hören Sie zu und schließen Sie sich im Herzen an.",
  },
  {
    title: "Stehen, sitzen, knien",
    text: "Orientieren Sie sich an den anderen. Die Haltung ist eine Hilfe. Niemand achtet darauf, ob Sie etwas „falsch“ machen.",
  },
  {
    title: "In Stille verweilen",
    text: "Nutzen Sie die stillen Momente, um zur Ruhe zu kommen. Sie sind Raum für Ihr persönliches Gebet.",
  },
  {
    title: "Nach der Messe",
    text: "Bleiben Sie auf ein Gespräch. Der Anfang ist nicht immer leicht. Unser Pfarrer ist eine gute erste Anlaufstelle.",
  },
] as const;
