import Link from "next/link";
import type { Metadata } from "next";
import { InternPage } from "@/components/intern/InternLayout";
import Responsive from "@/components/Responsive";
import {
  categoryBuckets,
  fmtNum,
  fmtPct,
  formatBuckets,
  loadPosts,
  loadTaxonomy,
  overviewStats,
  postsByReach,
} from "./data";
import { PostCard } from "./PostCard";

export const metadata: Metadata = {
  title: "Instagram Statistik | Pfarre Emmaus am Wienerberg",
  description:
    "Datengestützte Auswertung des Instagram-Kanals @pfarreemmaus: Welche Inhalte performen gut?",
};

export default function StatistikInstagramPage() {
  const posts = loadPosts();
  const overview = overviewStats(posts);
  const formats = formatBuckets(posts);
  const cats = categoryBuckets(posts);
  const taxonomy = loadTaxonomy();

  const topByReach = postsByReach(posts, "desc").slice(0, 10);
  const bottomByReach = postsByReach(posts, "asc").slice(0, 10);

  const byId = new Map(cats.map((c) => [c.id, c]));
  const katechese = byId.get("katechese-liturgie-erklaert");
  const fastenimpuls = byId.get("fastenimpuls-serie");
  const formatBySlug = new Map(formats.map((f) => [f.slug, f]));
  const videoReel = formatBySlug.get("video-reel");
  const staticReel = formatBySlug.get("static-reel");

  return (
    <InternPage title="Instagram Statistik">
      <Responsive>
        <div className="pb-20">
          <p className="mb-6 text-stone-600">
            Datengestützte Auswertung von{" "}
            <a
              href="https://instagram.com/pfarreemmaus"
              className="text-[#3A7276] hover:underline"
            >
              @pfarreemmaus
            </a>{" "}
            über die letzten 12 Monate. {fmtNum(overview.totalPosts)} Posts,{" "}
            {fmtNum(overview.totalReach)} Gesamtreichweite,{" "}
            {fmtNum(overview.totalNewFollowers)} neue Follower.
          </p>

          <ExecutiveSummary
            katechese={katechese}
            fastenimpuls={fastenimpuls}
            videoReel={videoReel}
            staticReel={staticReel}
            overview={overview}
          />

          <KpiRow overview={overview} />

          <Section
            title="Format-Vergleich"
            subtitle="Echte Videos schlagen Foto-mit-Musik-Reels deutlich, Bilder haben die höchste Engagement Rate"
          >
            <FormatTable formats={formats} />
          </Section>

          <Section
            title="Kategorien nach Median Engagement Rate"
            subtitle="Sakramenten-Posts performen am stärksten. Klick auf eine Kategorie für Details."
          >
            <CategoryTable cats={cats} />
          </Section>

          <Section
            title="Top 10 Posts nach Reach"
            subtitle="Was hat viral funktioniert?"
          >
            <div className="flex flex-col gap-2">
              {topByReach.map((p) => (
                <PostCard
                  key={p.postId}
                  post={p}
                  categoryName={
                    taxonomy.categories.find((c) => c.id === p.primaryCategory)
                      ?.name
                  }
                  showCategory
                />
              ))}
            </div>
          </Section>

          <Section
            title="Bottom 10 Posts nach Reach"
            subtitle="Welche Inhalte sind untergegangen?"
          >
            <div className="flex flex-col gap-2">
              {bottomByReach.map((p) => (
                <PostCard
                  key={p.postId}
                  post={p}
                  categoryName={
                    taxonomy.categories.find((c) => c.id === p.primaryCategory)
                      ?.name
                  }
                  showCategory
                />
              ))}
            </div>
          </Section>

          <Section title="Methodik" subtitle="Wie die Analyse zustande kommt">
            <Methodology />
          </Section>
        </div>
      </Responsive>
    </InternPage>
  );
}

function ExecutiveSummary({
  katechese,
  fastenimpuls,
  videoReel,
  staticReel,
  overview,
}: {
  katechese: ReturnType<typeof categoryBuckets>[number] | undefined;
  fastenimpuls: ReturnType<typeof categoryBuckets>[number] | undefined;
  videoReel: ReturnType<typeof formatBuckets>[number] | undefined;
  staticReel: ReturnType<typeof formatBuckets>[number] | undefined;
  overview: ReturnType<typeof overviewStats>;
}) {
  const katecheseShare = katechese
    ? katechese.totalNewFollowers / overview.totalNewFollowers
    : 0;
  const videoUplift =
    videoReel && staticReel && staticReel.medianEngagementRate > 0
      ? videoReel.medianEngagementRate / staticReel.medianEngagementRate - 1
      : 0;

  return (
    <div className="mb-10 rounded-xl border border-[#3A7276]/20 bg-[#3A7276]/[0.03] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">
          Zusammenfassung für die Eilige
        </h2>
        <Link
          href="/statistik-instagram/analyse"
          className="text-sm font-medium text-[#3A7276] hover:underline"
        >
          → Ganze Analyse mit Handlungsempfehlung
        </Link>
      </div>
      <ul className="space-y-3 text-sm text-stone-700">
        <SummaryBullet
          headline="Katechese ist der Follower-Magnet"
          detail={
            katechese
              ? `${katechese.totalNewFollowers} von ${overview.totalNewFollowers} neuen Followern (${fmtPct(katecheseShare)}) kamen aus ${katechese.posts.length} Katechese-Posts. 5× überproportional zu ihrem Posting-Anteil.`
              : ""
          }
          action="Mehr Reels die konkrete Fragen erklären."
        />
        <SummaryBullet
          headline="Fastenimpulse sind der Aufwand-Leck"
          detail={
            fastenimpuls
              ? `${fastenimpuls.posts.length} Posts für ${fmtPct(fastenimpuls.medianEngagementRate)} ER — schlechtester Wert aller Kategorien. 15% des Posting-Volumens für minimalen Impact.`
              : ""
          }
          action="Format verdichten (7 statt 40) oder in Stories verlagern."
        />
        <SummaryBullet
          headline="Echte Videos schlagen Foto + Musik"
          detail={
            videoReel && staticReel
              ? `Video-Reels: ${fmtPct(videoReel.medianEngagementRate)} ER, ${fmtNum(videoReel.medianReach)} Reach. Static-Reels: ${fmtPct(staticReel.medianEngagementRate)}, ${fmtNum(staticReel.medianReach)}. ${videoUplift > 0 ? `+${fmtPct(videoUplift)} mehr Engagement` : ""} für vergleichbaren Aufwand.`
              : ""
          }
          action="Wenn schon Reel produzieren, dann echt. Sonst als Bild posten."
        />
        <SummaryBullet
          headline="Ein Post zeigt das wahre Potenzial"
          detail={`Ein Katechese-Reel erreichte 14.736 Menschen — ${fmtPct(14736 / overview.totalReach)} der gesamten Jahres-Reichweite. Das ist kein Zufall, sondern ein Signal.`}
          action="Missionarisch gezielt posten, nicht mehr — weniger."
        />
      </ul>
    </div>
  );
}

function SummaryBullet({
  headline,
  detail,
  action,
}: {
  headline: string;
  detail: string;
  action: string;
}) {
  return (
    <li className="border-l-2 border-[#3A7276] pl-4">
      <div className="font-semibold text-stone-900">{headline}</div>
      <div className="mt-0.5 text-stone-600">{detail}</div>
      <div className="mt-1 text-[#3A7276]">→ {action}</div>
    </li>
  );
}

function KpiRow({ overview }: { overview: ReturnType<typeof overviewStats> }) {
  return (
    <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-5">
      <Kpi label="Posts" value={fmtNum(overview.totalPosts)} />
      <Kpi label="Reichweite" value={fmtNum(overview.totalReach)} />
      <Kpi label="Likes" value={fmtNum(overview.totalLikes)} />
      <Kpi label="Kommentare" value={fmtNum(overview.totalComments)} />
      <Kpi
        label="Neue Follower"
        value={`+${fmtNum(overview.totalNewFollowers)}`}
        highlight
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${highlight ? "border-[#3A7276]/30 bg-[#3A7276]/5" : "border-stone-200 bg-white"}`}
    >
      <div className="text-xs tracking-wide text-stone-500 uppercase">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold ${highlight ? "text-[#3A7276]" : "text-stone-900"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
      {subtitle && (
        <p className="mt-1 mb-4 text-sm text-stone-600">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}

function FormatTable({
  formats,
}: {
  formats: ReturnType<typeof formatBuckets>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
          <tr>
            <th className="px-4 py-2 text-left">Format</th>
            <th className="px-4 py-2 text-right">Anzahl</th>
            <th className="px-4 py-2 text-right">Med. Reach</th>
            <th className="px-4 py-2 text-right">Med. Views</th>
            <th className="px-4 py-2 text-right">Med. ER</th>
            <th className="px-4 py-2 text-right">Neue Follower</th>
          </tr>
        </thead>
        <tbody>
          {formats.map((f) => (
            <tr key={f.slug} className="border-t border-stone-100">
              <td className="px-4 py-3 font-medium text-stone-900">
                {f.label}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">{f.count}</td>
              <td className="px-4 py-3 text-right text-stone-700">
                {fmtNum(f.medianReach)}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {fmtNum(f.medianViews)}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {fmtPct(f.medianEngagementRate)}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {f.totalNewFollowers > 0 ? `+${f.totalNewFollowers}` : "0"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryTable({ cats }: { cats: ReturnType<typeof categoryBuckets> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase">
          <tr>
            <th className="px-4 py-2 text-left">Kategorie</th>
            <th className="px-4 py-2 text-right">Posts</th>
            <th className="px-4 py-2 text-right">Med. Reach</th>
            <th className="px-4 py-2 text-right">Med. Views</th>
            <th className="px-4 py-2 text-right">Med. ER</th>
            <th className="px-4 py-2 text-right">Med. Saves</th>
            <th className="px-4 py-2 text-right">Neue Follower</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr
              key={c.id}
              className="border-t border-stone-100 transition-colors hover:bg-stone-50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/statistik-instagram/${c.id}`}
                  className="font-medium text-[#3A7276] hover:underline"
                >
                  {c.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {c.posts.length}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {fmtNum(c.medianReach)}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {fmtNum(c.medianViews)}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {fmtPct(c.medianEngagementRate)}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {fmtNum(c.medianSaves)}
              </td>
              <td className="px-4 py-3 text-right text-stone-700">
                {c.totalNewFollowers > 0 ? `+${c.totalNewFollowers}` : "0"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Methodology() {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-5 text-sm text-stone-700">
      <ol className="ml-5 list-decimal space-y-2">
        <li>
          <strong>Scrape:</strong> Alle Posts der letzten 12 Monate wurden via{" "}
          <code className="rounded bg-stone-100 px-1">gallery-dl</code>{" "}
          heruntergeladen (Bilder, Reel-Thumbnails, Carousel-Seiten).
        </li>
        <li>
          <strong>Reel-Klassifikation:</strong> Für jedes Reel wurden drei
          Frames (25%, 50%, 75% der Dauer) extrahiert und per{" "}
          <em>Perceptual Hash</em> verglichen. Bei Hamming-Distanz ≤ 6 wird das
          Reel als &ldquo;Static&rdquo; (Foto mit Musik) markiert, sonst als
          echtes Video.
        </li>
        <li>
          <strong>Beschreibung:</strong> GPT-5 (Vision) erzeugt pro Post eine
          strukturierte Beschreibung (Inhalt, Themes, Ton, liturgisch ja/nein)
          aus Thumbnail + Caption + Metadaten.
        </li>
        <li>
          <strong>Taxonomie:</strong> GPT-5 leitet aus allen 305 Beschreibungen
          12 nicht-überlappende Kategorien ab, ohne Vorgabe.
        </li>
        <li>
          <strong>Klassifikation:</strong> Jeder Post wird der Taxonomie mit
          Primär- und Sekundär-Kategorie plus Confidence zugeordnet.
        </li>
        <li>
          <strong>Aggregation:</strong> Median-basierte Auswertung pro Kategorie
          und Format. Engagement Rate = (Likes + Kommentare + Shares + Saves) /
          Reach.
        </li>
      </ol>
    </div>
  );
}
