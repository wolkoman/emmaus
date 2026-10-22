export const PHOTOS = {
  pastor:
    "https://api.emmaus.wien/files/folder_69d39322a83675.04245879/full/img_69d3932407d555.72939261.jpg",
  portrait:
    "https://db.emmaus.wien/api/files/content_assets/s6pn3y3qbw8ze2e/zvonko_uid_679091f5771b4_ao9bx83416.png",
};

export type Member = { name: string; role?: string };

export const COUNCILS = [
  {
    title: "Pfarrgemeinderat",
    short: "PGR",
    text: "Der Pfarrgemeinderat ist ein gewähltes Gremium aus ehrenamtlichen Pfarrmitgliedern. Er unterstützt den Pfarrer in pastoralen Angelegenheiten, gestaltet das Gemeindeleben mit und vertritt die Anliegen der Gemeinde. Der aktuelle Pfarrgemeinderat wurde 2022 gewählt.",
    groups: [
      {
        members: [
          { name: "Zvonko Brezovski", role: "Vorsitzender" },
          { name: "Manuel Wolkowitsch", role: "stv. Vorsitzender" },
          { name: "Sabine Staudinger" },
          { name: "Michael Radisic" },
          { name: "Caroline Sucec" },
          { name: "Alexander Schoppelt" },
          { name: "Christian Pölzl" },
          { name: "Christian Samek", role: "ex officio, VVR" },
        ],
      },
      {
        label: "Schriftführer",
        members: [{ name: "Manuel Wolkowitsch" }],
      },
      {
        label: "Rechnungsprüfer:innen",
        members: [{ name: "Christian Pölzl" }, { name: "Karin Bauer" }],
      },
    ],
  },
  {
    title: "Vermögensverwaltungsrat",
    short: "VVR",
    text: "Der Vermögensverwaltungsrat besteht ebenfalls aus ehrenamtlichen Pfarrmitgliedern. Er verwaltet die Finanzen und das Eigentum der Pfarre, erstellt Haushaltspläne und sorgt für eine transparente und ordnungsgemäße Verwendung der Mittel.",
    groups: [
      {
        members: [
          { name: "Zvonko Brezovski", role: "Vorsitzender" },
          { name: "Christian Samek", role: "stv. Vorsitzender" },
          { name: "Klaudia Wolkowitsch" },
          { name: "Michael Radisic" },
          { name: "Angela Scheider" },
        ],
      },
    ],
  },
] satisfies {
  title: string;
  short: string;
  text: string;
  groups: { label?: string; members: Member[] }[];
}[];
