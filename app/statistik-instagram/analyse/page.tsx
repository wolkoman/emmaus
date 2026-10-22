import Link from "next/link";
import type { Metadata } from "next";
import { InternPage } from "@/components/intern/InternLayout";
import Responsive from "@/components/Responsive";
import {
  categoryBuckets,
  fmtNum,
  fmtPct,
  loadPosts,
  overviewStats,
} from "../data";

export const metadata: Metadata = {
  title: "Instagram-Strategie | Pfarre Emmaus am Wienerberg",
  description:
    "Was soll unser Ziel als Pfarre auf Instagram sein? Analyse und Handlungsempfehlung.",
};

export default function AnalysePage() {
  const posts = loadPosts();
  const overview = overviewStats(posts);
  const cats = categoryBuckets(posts);

  const byId = new Map(cats.map((c) => [c.id, c]));
  const katechese = byId.get("katechese-liturgie-erklaert");
  const fastenimpuls = byId.get("fastenimpuls-serie");
  const taufe = byId.get("sakrament-taufe");
  const bibel = byId.get("bibelwort-impuls");
  const wochen = byId.get("infos-und-wochenmitteilungen");

  const katecheseFollowerShare = katechese
    ? katechese.totalNewFollowers / overview.totalNewFollowers
    : 0;
  const katechesePostShare = katechese
    ? katechese.posts.length / overview.totalPosts
    : 0;

  return (
    <InternPage title="Strategie-Analyse">
      <Responsive>
        <div className="pb-20">
          <Link
            href="/statistik-instagram"
            className="mb-6 inline-flex items-center gap-1 text-sm text-[#3A7276] hover:underline"
          >
            ← Zurück zur Statistik
          </Link>

          <div className="mb-10 rounded-xl border border-stone-200 bg-stone-50/50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-stone-900">
              Die Leit-Frage
            </h2>
            <p className="text-stone-700">
              Eine Pfarre ist keine Marke. "Reichweite maximieren" ist kein
              legitimes Ziel per se. Bevor wir Performance-Empfehlungen geben,
              müssen wir klären:{" "}
              <em>
                Was soll unser Instagram-Kanal als Pfarre überhaupt leisten?
              </em>
            </p>
          </div>

          <Heading id="ziele">Drei mögliche Ziele</Heading>

          <div className="mb-10 grid gap-4 md:grid-cols-3">
            <GoalCard
              letter="A"
              title="Gemeinde-Binnenkommunikation"
              description='"Unsere Community informieren und verbinden"'
              what="Wochenmitteilungen, Termine, Rückblicke"
              problem="Instagram-Algorithmus bestraft Infoplakat-Content. Bessere Kanäle: Newsletter, Stories, Website. Feed-Posts mit Terminlisten erreichen fast nur bestehende Follower."
              evidence={
                wochen
                  ? `Belegt: Wochenmitteilungen erreichen median ${fmtNum(wochen.medianReach)} Reach — niedrigster Wert aller Kategorien. Keine neuen Follower in 12 Monaten.`
                  : ""
              }
              verdict="nein"
            />
            <GoalCard
              letter="B"
              title="Geistlicher Impuls"
              description='"Wir begleiten Gläubige spirituell"'
              what="Fastenimpulse, Bibelworte, Predigtauszüge"
              problem="Kann funktionieren, aber nur wenn Inhalt save-würdig ist (Motto: 'Das will ich mir merken'). Reine Zitat-Grafiken werden weggescrollt."
              evidence={
                fastenimpuls && bibel
                  ? `In Daten: Fastenimpuls-Serie (${fastenimpuls.posts.length} Posts) hat ${fmtPct(fastenimpuls.medianEngagementRate)} ER — schlechtester Wert. Bibelworte (${bibel.posts.length} Posts): ${fmtPct(bibel.medianEngagementRate)}. Beide deutlich unter dem Schnitt. Saves: nahe null.`
                  : ""
              }
              verdict="teilweise"
            />
            <GoalCard
              letter="C"
              title="Missionarische Reichweite"
              description='"Wir erreichen, wen wir sonntags nicht erreichen"'
              what="Katechese, Liturgie erklärt, Antworten auf Fragen die Menschen wirklich haben"
              problem={undefined}
              evidence={
                katechese
                  ? `Belegt: Katechese-Kategorie ist mit ${katechese.totalNewFollowers} neuen Followern aus ${katechese.posts.length} Posts der Follower-Motor — ${fmtPct(katecheseFollowerShare)} aller Neuzugänge aus ${fmtPct(katechesePostShare)} aller Posts (5× überproportional). Der einzig virale Post gehört hierher.`
                  : ""
              }
              verdict="ja"
            />
          </div>

          <Heading id="theologisch">Theologische Einordnung</Heading>

          <div className="mb-10 space-y-4 text-stone-700">
            <p>
              Die Kirche hat einen Missionsauftrag —{" "}
              <em>"Geht also hin und lehret alle Völker"</em> (Mt 28,19). Papst
              Franziskus schreibt in <em>Evangelii Gaudium</em>, dass die Freude
              des Evangeliums sich ihrer Natur nach mitteilen will. Digitale
              Evangelisierung ist kirchlich ausdrücklich erwünscht.
            </p>
            <p>
              <strong>Instagram ist Außendienst, nicht Pfarrblatt.</strong> Die
              Menschen in der Kirchenbank erreichst du sonntags persönlich; die
              digitalen Zufalls-Zuschauer erreichst du nur hier. Daraus folgt:
              Ziel C sollte dominieren, B sekundär bleiben, A ist eigentlich
              kein Instagram-Thema.
            </p>
          </div>

          <Heading id="empfehlung">Empfehlung: Zielhierarchie und KPIs</Heading>

          <div className="mb-10 space-y-4">
            <GoalTier
              tier="Primärziel"
              color="border-[#3A7276] bg-[#3A7276]/5"
              title="Mission — neue Menschen erreichen"
              target="300+ neue Follower pro Jahr, davon ≥ 50% aus Katechese-/Erklär-Content"
              kpi="Neue Follower pro Post, aufgeschlüsselt nach Kategorie"
              baseline={`Ist-Stand: ${overview.totalNewFollowers} neue Follower aus ${overview.totalPosts} Posts (${(overview.totalNewFollowers / overview.totalPosts).toFixed(2)} / Post). Verdopplung realistisch bei Fokus auf Katechese.`}
            />
            <GoalTier
              tier="Sekundärziel"
              color="border-stone-300 bg-stone-50"
              title="Geistliche Begleitung der Community"
              target="Median Saves pro Post > 0 in der Bibelwort-Kategorie"
              kpi="Saves als Proxy für 'das war mir wichtig genug zum Merken'"
              baseline="Ist-Stand: Median Saves ≈ 0 in fast allen Kategorien. Hier ist viel Raum nach oben."
            />
            <GoalTier
              tier="Kein Ziel"
              color="border-stone-200 bg-stone-100"
              title="Reichweite / Likes um ihrer selbst willen"
              target="—"
              kpi="—"
              baseline="Ein Pfarr-Kanal braucht keine 100k Follower. Er braucht die richtigen."
            />
          </div>

          <Heading id="redaktions-strategie">
            Ableitung: Redaktions-Strategie
          </Heading>

          <p className="mb-4 text-stone-700">
            Was das konkret für deine Content-Planung bedeutet — sortiert nach
            Priorität.
          </p>

          <div className="mb-10 overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Format</th>
                  <th className="px-4 py-2 text-left">Warum</th>
                  <th className="px-4 py-2 text-left">Rhythmus</th>
                </tr>
              </thead>
              <tbody>
                <StrategyRow
                  format="Katechese-Reel (echtes Video)"
                  why="Follower-Magnet mit nachgewiesener Viralitäts-Chance"
                  cadence="1-2 × pro Woche — Kern-Content"
                  tone="positive"
                />
                <StrategyRow
                  format="Sakramenten-Post (echte Feier, kein reiner Gruß)"
                  why="Familien teilen, Community-Identifikation, hoher ER"
                  cadence="Event-getrieben — alle machen"
                  tone="positive"
                />
                <StrategyRow
                  format="Gemeindeleben-Rückblick"
                  why="Identitätsstiftung, gute ER"
                  cadence="Wöchentlich, nach Events"
                  tone="positive"
                />
                <StrategyRow
                  format="Bibelwort — aber save-würdig"
                  why="Geistlicher Impuls wirkt nur wenn gemerkt. Format-Check: Zitat das ich mir notieren würde?"
                  cadence="1 × pro Woche, mit Format-Iteration"
                  tone="neutral"
                />
                <StrategyRow
                  format="Fastenimpulse"
                  why={`Schlechteste ER aller Kategorien (${fastenimpuls ? fmtPct(fastenimpuls.medianEngagementRate) : "niedrig"}), marginales Follower-Wachstum`}
                  cadence="7 Posts pro Fastenzeit (Sonntage + Karwoche), nicht 40+ — oder in Stories"
                  tone="reduce"
                />
                <StrategyRow
                  format="Predigt-Clips"
                  why="Mittlere Performance, größter Produktions-Aufwand"
                  cadence="Nur die besten 5-10% pro Jahr. Teste: Zitat-Grafik + YouTube-Link statt Reel"
                  tone="reduce"
                />
                <StrategyRow
                  format="Wochenmitteilungen im Feed"
                  why="Niedrigster Reach, Spam-Signal für Algorithmus"
                  cadence="Streichen — nur Stories oder Newsletter"
                  tone="drop"
                />
                <StrategyRow
                  format="Static-Reels (Foto + Musik)"
                  why="113 Stück im letzten Jahr. Produktions-Overhead ohne Payoff: 80% schlechter als echte Videos, schlechter als Bilder allein"
                  cadence="Als Bild oder Carousel posten — das Format hat seinen eigenen Platz"
                  tone="drop"
                />
              </tbody>
            </table>
          </div>

          <Heading id="viral">Der virale Post als Signal</Heading>

          <div className="mb-10 space-y-4 text-stone-700">
            <p>
              Ein einzelner Post vom 18.02.2026 (Katechese-Reel, Erklärung eines
              liturgischen Details) hat <strong>14.736 Reach</strong> erzielt —{" "}
              {fmtPct(14736 / overview.totalReach)} deiner gesamten
              Jahresreichweite aus einem einzigen Beitrag.
            </p>
            <p>
              Das ist kein Zufall. Es ist ein Signal: Katechese-Content, der
              konkrete Fragen von Menschen beantwortet (
              <em>"Warum macht der Priester X?"</em>), hat Potenzial weit über
              die Gemeindegrenze hinaus. Der Algorithmus spielt solche
              erklärenden Inhalte überproportional aus, weil sie gespeichert und
              geteilt werden.
            </p>
            <p>
              <strong>Konkretes Experiment:</strong> Monatlich 1-2
              Katechese-Reels mit klarer Frage im Hook. Beispiele:{" "}
              <em>
                "Warum heißt die Kerze am Altar Ewiges Licht?" · "Was bedeutet
                das Violett in der Fastenzeit?" · "Warum knien wir zur
                Wandlung?"
              </em>{" "}
              Realistisches Jahresziel bei konsequenter Umsetzung:{" "}
              <strong>500+ neue Follower, 500k+ Reach</strong> — mit{" "}
              <em>weniger</em> Posts als dieses Jahr.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-6 text-sm text-stone-700">
            <strong className="text-stone-900">
              Zusammengefasst in einem Satz:
            </strong>{" "}
            Die Pfarre sollte auf Instagram <em>weniger</em>, aber{" "}
            <em>missionarisch gezielter</em> posten — mit klarem Fokus auf
            erklärende Katechese-Videos, weil dort der echte Wachstums-Potenzial
            liegt und dort gleichzeitig der kirchliche Auftrag am besten
            eingelöst wird.
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

function GoalCard({
  letter,
  title,
  description,
  what,
  problem,
  evidence,
  verdict,
}: {
  letter: string;
  title: string;
  description: string;
  what: string;
  problem?: string;
  evidence: string;
  verdict: "ja" | "nein" | "teilweise";
}) {
  const verdictStyles = {
    ja: "border-[#3A7276] bg-[#3A7276]/5",
    nein: "border-stone-200 bg-stone-100/50 opacity-75",
    teilweise: "border-amber-200 bg-amber-50/50",
  };
  const verdictLabel = {
    ja: "✓ passt",
    nein: "✗ nicht geeignet",
    teilweise: "~ mit Vorbehalt",
  };

  return (
    <div className={`rounded-xl border p-5 ${verdictStyles[verdict]}`}>
      <div className="flex items-center justify-between">
        <span className="flex size-8 items-center justify-center rounded-full bg-white font-bold text-stone-900">
          {letter}
        </span>
        <span className="text-xs font-medium text-stone-600">
          {verdictLabel[verdict]}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600 italic">{description}</p>
      <div className="mt-4 space-y-2 text-sm text-stone-700">
        <p>
          <strong>Typischer Content:</strong> {what}
        </p>
        {problem && (
          <p>
            <strong>Problem:</strong> {problem}
          </p>
        )}
        <p className="text-xs text-stone-600">{evidence}</p>
      </div>
    </div>
  );
}

function GoalTier({
  tier,
  color,
  title,
  target,
  kpi,
  baseline,
}: {
  tier: string;
  color: string;
  title: string;
  target: string;
  kpi: string;
  baseline: string;
}) {
  return (
    <div className={`rounded-lg border-2 p-5 ${color}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold tracking-wide text-stone-600 uppercase">
          {tier}
        </span>
        <h3 className="text-lg font-bold text-stone-900">{title}</h3>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-stone-700 md:grid-cols-3">
        <div>
          <div className="text-xs tracking-wide text-stone-500 uppercase">
            Zielwert
          </div>
          <div>{target}</div>
        </div>
        <div>
          <div className="text-xs tracking-wide text-stone-500 uppercase">
            Metrik
          </div>
          <div>{kpi}</div>
        </div>
        <div>
          <div className="text-xs tracking-wide text-stone-500 uppercase">
            Baseline
          </div>
          <div>{baseline}</div>
        </div>
      </div>
    </div>
  );
}

function StrategyRow({
  format,
  why,
  cadence,
  tone,
}: {
  format: string;
  why: string;
  cadence: string;
  tone: "positive" | "neutral" | "reduce" | "drop";
}) {
  const tones = {
    positive: "text-[#3A7276]",
    neutral: "text-stone-700",
    reduce: "text-amber-700",
    drop: "text-stone-500 line-through",
  };
  const dots = {
    positive: "●●●",
    neutral: "●●",
    reduce: "●",
    drop: "○",
  };

  return (
    <tr className="border-t border-stone-100 align-top">
      <td className="px-4 py-3">
        <div className={`font-medium ${tones[tone]}`}>{format}</div>
        <div className="mt-1 text-xs text-stone-500">{dots[tone]}</div>
      </td>
      <td className="px-4 py-3 text-sm text-stone-700">{why}</td>
      <td className="px-4 py-3 text-sm text-stone-700">{cadence}</td>
    </tr>
  );
}
