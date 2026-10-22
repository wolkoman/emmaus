import type { Metadata } from "next";
import { InternPage } from "@/components/intern/InternLayout";
import Responsive from "@/components/Responsive";

export const metadata: Metadata = {
  title: "Wochenmitteilungen-Auswertung | Pfarre Emmaus am Wienerberg",
  description:
    "Analyse der Wochenmitteilungen der letzten 12 Monate: Inhalte, Wiederholungen und Rhythmus — als Grundlage für die Entscheidung über einen Monats-Newsletter.",
};

/**
 * Statische Auswertung der Wochenmitteilungen 27.07.2025 – 05.07.2026
 * (48 Ausgaben). Datengrundlage: PocketBase-Collection `weeklies`,
 * Analyse-Stichtag 20.07.2026. Siehe analysis/wochenblatt/summary.md.
 */

const MONTHLY_NEW = [
  { month: "Aug 25", neu: 2, gesamt: 7 },
  { month: "Sep 25", neu: 8, gesamt: 9 },
  { month: "Okt 25", neu: 7, gesamt: 11 },
  { month: "Nov 25", neu: 13, gesamt: 16 },
  { month: "Dez 25", neu: 5, gesamt: 9 },
  { month: "Jän 26", neu: 5, gesamt: 11 },
  { month: "Feb 26", neu: 9, gesamt: 11 },
  { month: "Mär 26", neu: 10, gesamt: 15 },
  { month: "Apr 26", neu: 8, gesamt: 9 },
  { month: "Mai 26", neu: 10, gesamt: 14 },
  { month: "Jun 26", neu: 8, gesamt: 9 },
];

const REPEAT_CHAINS = [
  {
    title: "Pfarrball – Eine Nacht in Hollywood",
    count: 5,
    range: "Dez 2025 – Jän 2026",
    note: "gleicher Inhalt über die gesamten Feiertage",
  },
  {
    title: "Save the date: Pfarrfest",
    count: 4,
    range: "Jul – Aug 2025",
    note: "über den ganzen Sommer",
  },
  {
    title: "Brunnenprojekt in Benin",
    count: 4,
    range: "Mai – Jun 2026",
    note: "identisches Bild ohne Text, 4 Wochen in Folge",
  },
  {
    title: "Einladung zu den Passionsspielen",
    count: 4,
    range: "Apr – Mai 2026",
    note: "3 Wochen davon mit unverändertem Text",
  },
  {
    title: "Kreuzweg und Hl. Messe",
    count: 4,
    range: "Feb – Mär 2026",
    note: "Fastenzeit-Dauerläufer",
  },
  {
    title: "Rorate in der Vorweihnachtszeit",
    count: 3,
    range: "Nov – Dez 2025",
    note: "",
  },
];

export default function WochenmitteilungenAuswertung() {
  return (
    <InternPage title="Wochenmitteilungen-Auswertung">
      <Responsive>
        <div className="pb-20">
          <div className="mb-10 rounded-xl border border-stone-200 bg-stone-50/50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-stone-900">
              Die Leit-Frage
            </h2>
            <p className="text-stone-700">
              Sollen die Wochenmitteilungen auf einen <em>Monats-Newsletter</em>{" "}
              umgestellt werden? Dazu wurden alle 48 Ausgaben der letzten 12
              Monate (27.07.2025 – 05.07.2026) inhaltlich ausgewertet: Wie viel
              ist jede Woche wirklich neu, was wiederholt sich, und wie flexibel
              ist der Rhythmus heute schon?
            </p>
            <p className="mt-2 text-xs text-stone-500">
              Datengrundlage: Redaktionssystem (Collection <code>weeklies</code>
              ), Stichtag 20.07.2026. Hinweis: Der Versand-Status wurde nicht
              ausgewertet, da er auch technische Ursachen haben kann.
            </p>
          </div>

          <div className="mb-10 flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600">
            <span aria-hidden className="text-lg">
              ✨
            </span>
            <p>
              <strong className="text-stone-800">KI-Hinweis:</strong> Diese
              Auswertung wurde mit Unterstützung künstlicher Intelligenz
              erstellt — sowohl die statistische Analyse der Ausgaben als auch
              Text und Gestaltung dieser Seite. Die Ergebnisse wurden
              redaktionell geprüft; einzelne Einordnungen können dennoch
              fehlerhaft sein.
            </p>
          </div>

          <Heading id="kennzahlen">Kennzahlen auf einen Blick</Heading>

          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              value="48"
              label="Ausgaben in 12 Monaten"
              sub="lückenlose Abdeckung"
            />
            <StatCard
              value="2,6"
              label="Artikel pro Ausgabe"
              sub="125 gesamt · min 1 · max 5"
            />
            <StatCard
              value="30 %"
              label="echte Wiederholungen"
              sub="Text >80 % identisch oder gleiches Bild"
            />
            <StatCard
              value="15,5"
              label="Termine pro Ausgabe"
              sub="davon 37–50 % fixes Standardprogramm"
            />
          </div>

          <Heading id="struktur">Was steckt in einer Ausgabe?</Heading>

          <div className="mb-10 space-y-4 text-stone-700">
            <p>
              Jede Ausgabe besteht aus drei Bausteinen: dem{" "}
              <strong>Terminkalender</strong> (automatisch aus dem
              Pfarrkalender), dem <strong>Evangelium</strong> (automatisch
              geladen) und <strong>1–5 redaktionellen Artikeln</strong> (Ø 2,6,
              typischerweise 250–500 Zeichen). Nur die Artikel sind „Handarbeit"
              — Kalender und Evangelium entstehen ohne redaktionellen Aufwand.
            </p>
            <p>
              Der Terminkalender besteht übers Jahr zu gut einem Drittel, im
              letzten Halbjahr zur Hälfte, aus dem jede Woche identischen
              Standardprogramm (Sonntags-/Werktagsmessen, Rosenkranz,
              Emmausgebet, Kreativrunde). Der Rest sind echte Sondertermine — Ø
              8–10 pro Woche.
            </p>
          </div>

          <Heading id="neue-artikel">Neue Artikel pro Monat</Heading>

          <p className="mb-4 text-stone-700">
            Wie viele Artikel pro Monat waren wirklich neu (dunkel) — und wie
            viele Wiederholungen früherer Beiträge (hell)? Im Schnitt erscheinen{" "}
            <strong>~2 neue Artikel pro Woche</strong>, mit deutlicher
            Saisonalität.
          </p>

          <div className="mb-4 overflow-x-auto rounded-lg border border-stone-200 bg-white p-4">
            <div
              className="flex min-w-[560px] items-end gap-2"
              style={{ height: 180 }}
            >
              {MONTHLY_NEW.map((m) => (
                <div
                  key={m.month}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="flex w-full flex-col justify-end"
                    style={{ height: 140 }}
                  >
                    <div
                      className="w-full rounded-t bg-stone-300"
                      style={{ height: `${((m.gesamt - m.neu) / 16) * 140}px` }}
                      title={`${m.gesamt - m.neu} Wiederholungen`}
                    />
                    <div
                      className="w-full bg-[#3A7276]"
                      style={{ height: `${(m.neu / 16) * 140}px` }}
                      title={`${m.neu} neue Artikel`}
                    />
                  </div>
                  <div className="text-center text-[10px] text-stone-500">
                    <div className="font-semibold text-stone-700">
                      {m.neu}/{m.gesamt}
                    </div>
                    {m.month}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-1">
                <span className="inline-block size-3 rounded bg-[#3A7276]" />{" "}
                neu
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block size-3 rounded bg-stone-300" />{" "}
                Wiederholung
              </span>
            </div>
          </div>

          <p className="mb-10 text-sm text-stone-600">
            Stark: November (13 neue Artikel) und die Fastenzeit. Schwach:
            August (2 von 7 neu) sowie Dezember/Jänner — in den Feiertags- und
            Ferienphasen trägt der Wochenrhythmus erkennbar nicht.
          </p>

          <Heading id="wiederholungen">Wiederholungen vs. Serien</Heading>

          <p className="mb-4 text-stone-700">
            Wichtig ist die Unterscheidung zwischen{" "}
            <strong>echten Wiederholungen</strong> (Inhalt praktisch unverändert
            erneut abgedruckt) und <strong>Serien</strong> (wiederkehrender
            Titel, aber jedes Mal frischer Inhalt):
          </p>

          <div className="mb-6 overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Unveränderter Inhalt</th>
                  <th className="px-4 py-2 text-left">Ausgaben</th>
                  <th className="px-4 py-2 text-left">Zeitraum</th>
                  <th className="px-4 py-2 text-left">Anmerkung</th>
                </tr>
              </thead>
              <tbody>
                {REPEAT_CHAINS.map((c) => (
                  <tr
                    key={c.title}
                    className="border-t border-stone-100 align-top"
                  >
                    <td className="px-4 py-3 font-medium text-stone-800">
                      {c.title}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{c.count}×</td>
                    <td className="px-4 py-3 text-stone-700">{c.range}</td>
                    <td className="px-4 py-3 text-stone-600">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#3A7276] bg-[#3A7276]/5 p-5">
              <h3 className="text-base font-bold text-stone-900">
                Serien sind keine Redundanz
              </h3>
              <p className="mt-2 text-sm text-stone-700">
                Der <strong>Buchclub</strong> erschien 10× übers Jahr — aber
                jede Runde mit neuem Buch, neuem Termin und neu geschriebenem
                Text. Das ist laufendes Pfarrleben, kein Füllmaterial. Ähnlich
                die Alphakurs-Einladungen, deren Text wöchentlich variiert
                wurde.
              </p>
            </div>
            <div className="rounded-xl border border-[#3A7276] bg-[#3A7276]/5 p-5">
              <h3 className="text-base font-bold text-stone-900">
                Impulse sind redaktioneller Inhalt
              </h3>
              <p className="mt-2 text-sm text-stone-700">
                Fastenimpulse, Gedankenimpulse und Feiertagsgrüße sind jeweils
                eigenständig geschriebene geistliche Kurztexte. Sie haben
                eigenen Wert — und sind zugleich nicht terminkritisch, d. h. sie
                funktionieren in einem Monatsformat genauso gut.
              </p>
            </div>
          </div>

          <Heading id="rhythmus">Der Rhythmus ist heute schon flexibel</Heading>

          <div className="mb-10 space-y-3">
            <RhythmRow
              period="Sommer 2025"
              detail="Ausgabe 27.07. – 31.08. (5 Wochen), mit zwei Zwischen-Updates, die fast nur Wiederholungen enthielten"
            />
            <RhythmRow
              period="Weihnachten 2025"
              detail="Ausgabe 24.12. – 07.01. (2 Wochen)"
            />
            <RhythmRow
              period="Sommer 2026"
              detail="Ausgabe 05.07. – 02.08. (4 Wochen) — de facto ein Monatsblatt"
            />
          </div>

          <p className="mb-10 text-stone-700">
            Dazu kommt: Ankündigungen haben lange Vorlaufzeiten — Pfarrfest 6
            Wochen, Buchclub bis 7 Wochen, Pfarrball und Alphakurs je 5 Wochen.
            Der Großteil der Inhalte ist also gar nicht wochenaktuell, sondern
            Vorschau.
          </p>

          <Heading id="einschaetzung">Einschätzung: Monats-Newsletter?</Heading>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border-2 border-[#3A7276] bg-[#3A7276]/5 p-5">
              <h3 className="text-base font-bold text-stone-900">
                Was dafür spricht
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-stone-700">
                <li>
                  Nur ~2 neue Artikel pro Woche; 30 % unveränderte
                  Wiederholungen deuten darauf hin, dass Inhalte gestreckt
                  werden, um den Wochenrhythmus zu bedienen.
                </li>
                <li>
                  In Ferien- und Feiertagsphasen (August, Dezember/Jänner) trägt
                  der Wochenrhythmus nicht — dort wird heute schon wiederholt
                  oder zusammengelegt.
                </li>
                <li>
                  Lange Ankündigungs-Vorlaufzeiten passen gut zu einer
                  Monatsvorschau.
                </li>
                <li>
                  Impuls-Texte sind zeitlos und im Monatsformat gleichwertig.
                </li>
                <li>
                  Die Mehrwochen-Ausgaben im Sommer und zu Weihnachten zeigen:
                  das Format funktioniert bereits.
                </li>
                <li>
                  <strong>Aufwand:</strong> Jede Wochenausgabe bedeutet
                  redaktionelle Erstellung und Fertigung — 48 Ausgaben pro Jahr
                  für Ø 2 neue Artikel pro Woche. Ein Monatsrhythmus reduziert
                  diesen Fixaufwand auf ein Viertel.
                </li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-5">
              <h3 className="text-base font-bold text-stone-900">
                Was zu beachten ist
              </h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-stone-700">
                <li>
                  Kurzfristiges (Blasiussegen, Gedenkmessen, kurzfristige
                  Änderungen) braucht einen Kanal mit weniger als einem Monat
                  Latenz.
                </li>
                <li>
                  Im Herbst und in der Fastenzeit gibt es genug wochenaktuellen
                  Stoff — ein starrer Monatsrhythmus würde diese Hochphasen
                  einengen.
                </li>
                <li>
                  Hybrid- und Saisonmodelle erschweren die Planbarkeit: zwei
                  parallele Formate bzw. wechselnde Rhythmen bedeuten mehr
                  Koordinationsaufwand für Redaktion und Leserschaft als ein
                  einziger, fixer Takt.
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6 text-sm text-stone-700">
            <strong className="text-stone-900">
              Zusammengefasst in einem Satz:
            </strong>{" "}
            Die Inhaltsmenge (~2 neue Artikel/Woche, 30 % Wiederholungen)
            rechtfertigt den wöchentlichen Erstellungs- und Fertigungsaufwand
            nicht — wer Planbarkeit und geringen Aufwand priorisiert, fährt mit
            einem fixen Monats-Newsletter am besten; Hybrid- oder Saisonmodelle
            holen zwar inhaltlich mehr heraus (Hochphasen, Kurzfristiges),
            erkaufen das aber mit schwererer Planbarkeit und laufendem
            Zusatzaufwand.
          </div>
        </div>
      </Responsive>
    </InternPage>
  );
}

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-4 mb-4 scroll-mt-6 text-2xl font-bold text-stone-900"
    >
      {children}
    </h2>
  );
}

function StatCard({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="text-3xl font-bold text-[#3A7276]">{value}</div>
      <div className="mt-1 font-medium text-stone-800">{label}</div>
      <div className="mt-1 text-xs text-stone-500">{sub}</div>
    </div>
  );
}

function RhythmRow({ period, detail }: { period: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-baseline sm:gap-4">
      <div className="shrink-0 font-semibold text-stone-900 sm:w-44">
        {period}
      </div>
      <div className="text-sm text-stone-700">{detail}</div>
    </div>
  );
}
