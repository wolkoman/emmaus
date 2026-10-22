import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { loadPostsFromCsv, computeEngagementRate } from "./load-posts";
import type {
  Category,
  InstagramPost,
  PostClassification,
  PostDescription,
} from "./types";

const DESCRIPTIONS_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/descriptions.json";
const CATEGORIES_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/categories.json";
const CLASSIFICATIONS_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/classifications.json";
const REPORT_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/output/report.md";
const DATA_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/output/joined-data.json";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + "%";
}

function fmtNum(n: number): string {
  return n.toLocaleString("de-AT", { maximumFractionDigits: 0 });
}

function loadJson<T>(path: string): T {
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

interface JoinedPost extends InstagramPost {
  description?: PostDescription;
  classification?: PostClassification;
  engagementRate: number;
}

function joinData(): {
  posts: JoinedPost[];
  categories: Category[];
} {
  const rawPosts = loadPostsFromCsv();
  const descriptions = loadJson<Record<string, PostDescription>>(DESCRIPTIONS_FILE);
  const classifications = loadJson<Record<string, PostClassification>>(
    CLASSIFICATIONS_FILE,
  );
  const taxonomy = loadJson<{ categories: Category[] }>(CATEGORIES_FILE);

  const validIds = new Set(taxonomy.categories.map((c) => c.id));
  function normalizeCategory(id: string | undefined): string | undefined {
    if (!id) return id;
    const stripped = id.replace(/^\[|\]$/g, "").trim();
    return validIds.has(stripped) ? stripped : id;
  }

  const posts: JoinedPost[] = rawPosts.map((p) => {
    const c = classifications[p.postId];
    const normalized = c
      ? {
          ...c,
          primaryCategory: normalizeCategory(c.primaryCategory) ?? c.primaryCategory,
          secondaryCategories: c.secondaryCategories
            .map((id) => normalizeCategory(id) ?? id)
            .filter((id): id is string => !!id),
        }
      : undefined;
    return {
      ...p,
      description: descriptions[p.postId],
      classification: normalized,
      engagementRate: computeEngagementRate(p),
    };
  });

  return { posts, categories: taxonomy.categories };
}

interface CategoryStat {
  id: string;
  name: string;
  posts: JoinedPost[];
  medianReach: number;
  medianViews: number;
  medianLikes: number;
  medianEngagementRate: number;
  medianSaves: number;
  medianComments: number;
  medianShares: number;
  totalNewFollowers: number;
  staticReelsPct: number;
  videoReelsPct: number;
  top3: JoinedPost[];
}

function aggregateByCategory(
  posts: JoinedPost[],
  categories: Category[],
): CategoryStat[] {
  const byId = new Map<string, JoinedPost[]>();
  for (const cat of categories) byId.set(cat.id, []);
  for (const p of posts) {
    const catId = p.classification?.primaryCategory ?? "uncategorized";
    if (!byId.has(catId)) byId.set(catId, []);
    byId.get(catId)!.push(p);
  }

  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  const stats: CategoryStat[] = [];
  for (const [id, catPosts] of byId.entries()) {
    const reels = catPosts.filter((p) => p.postType === "IG reel");
    const staticReels = reels.filter((p) => p.reelMotion?.isStatic).length;
    const videoReels = reels.length - staticReels;
    const sorted = [...catPosts].sort(
      (a, b) => b.engagementRate - a.engagementRate,
    );
    stats.push({
      id,
      name: nameById.get(id) ?? id,
      posts: catPosts,
      medianReach: median(catPosts.map((p) => p.reach)),
      medianViews: median(catPosts.map((p) => p.views)),
      medianLikes: median(catPosts.map((p) => p.likes)),
      medianEngagementRate: median(catPosts.map((p) => p.engagementRate)),
      medianSaves: median(catPosts.map((p) => p.saves)),
      medianComments: median(catPosts.map((p) => p.comments)),
      medianShares: median(catPosts.map((p) => p.shares)),
      totalNewFollowers: catPosts.reduce((a, b) => a + b.newFollowers, 0),
      staticReelsPct: reels.length > 0 ? staticReels / reels.length : 0,
      videoReelsPct: reels.length > 0 ? videoReels / reels.length : 0,
      top3: sorted.slice(0, 3),
    });
  }

  return stats.sort((a, b) => b.medianEngagementRate - a.medianEngagementRate);
}

function renderCategoryTable(stats: CategoryStat[]): string {
  const rows: string[] = [
    "| Kategorie | Posts | Med. Reach | Med. Views | Med. ER | Med. Saves | Neue Follower |",
    "|---|---:|---:|---:|---:|---:|---:|",
  ];
  for (const s of stats) {
    rows.push(
      `| **${s.name}** | ${s.posts.length} | ${fmtNum(s.medianReach)} | ${fmtNum(s.medianViews)} | ${fmtPct(s.medianEngagementRate)} | ${fmtNum(s.medianSaves)} | ${s.totalNewFollowers} |`,
    );
  }
  return rows.join("\n");
}

function renderMotionAnalysis(posts: JoinedPost[]): string {
  const reels = posts.filter((p) => p.postType === "IG reel");
  const staticReels = reels.filter((p) => p.reelMotion?.isStatic);
  const videoReels = reels.filter(
    (p) => p.reelMotion && !p.reelMotion.isStatic,
  );
  const images = posts.filter((p) => p.postType === "IG image");
  const carousels = posts.filter((p) => p.postType === "IG carousel");

  const groups = [
    { label: "Static Reels (Foto + Musik)", items: staticReels },
    { label: "Echte Video Reels", items: videoReels },
    { label: "Bilder", items: images },
    { label: "Carousels", items: carousels },
  ];

  const rows: string[] = [
    "| Format | Anzahl | Med. Reach | Med. Views | Med. ER | Med. Saves |",
    "|---|---:|---:|---:|---:|---:|",
  ];
  for (const g of groups) {
    if (g.items.length === 0) continue;
    rows.push(
      `| **${g.label}** | ${g.items.length} | ${fmtNum(median(g.items.map((p) => p.reach)))} | ${fmtNum(median(g.items.map((p) => p.views)))} | ${fmtPct(median(g.items.map((p) => p.engagementRate)))} | ${fmtNum(median(g.items.map((p) => p.saves)))} |`,
    );
  }
  return rows.join("\n");
}

function renderCategoryDetails(stats: CategoryStat[], categories: Category[]): string {
  const defById = new Map(categories.map((c) => [c.id, c]));
  const sections: string[] = [];
  for (const s of stats) {
    const def = defById.get(s.id);
    sections.push(
      `### ${s.name}`,
      "",
      `_${def?.description ?? "(Kategorie außerhalb der Taxonomie)"}_`,
      "",
      `**${s.posts.length} Posts** | Median Reach: ${fmtNum(s.medianReach)} | Median Views: ${fmtNum(s.medianViews)} | Median ER: ${fmtPct(s.medianEngagementRate)} | Neue Follower: ${s.totalNewFollowers}`,
      "",
    );
    if (s.posts.filter((p) => p.postType === "IG reel").length > 0) {
      sections.push(
        `Reel-Mix: ${fmtPct(s.staticReelsPct)} static | ${fmtPct(s.videoReelsPct)} Video`,
        "",
      );
    }
    sections.push("**Top 3 Posts nach Engagement Rate:**", "");
    for (const p of s.top3) {
      const dateShort = (p.publishedAt || "").split(" ")[0];
      const caption = (p.description?.description ?? p.description ?? "").slice(0, 120);
      sections.push(
        `- [${dateShort}](${p.permalink}) · ER ${fmtPct(p.engagementRate)} · Reach ${fmtNum(p.reach)} · ${p.postType}`,
      );
      if (caption) sections.push(`  _${caption}_`);
    }
    sections.push("");
  }
  return sections.join("\n");
}

function renderBiggestWins(posts: JoinedPost[]): string {
  const sorted = [...posts].sort((a, b) => b.reach - a.reach);
  const top = sorted.slice(0, 10);
  const rows: string[] = [
    "| Datum | Kategorie | Format | Reach | ER | Saves | Beschreibung |",
    "|---|---|---|---:|---:|---:|---|",
  ];
  for (const p of top) {
    const dateShort = (p.publishedAt || "").split(" ")[0];
    const cat = p.classification?.primaryCategory ?? "—";
    const format =
      p.postType === "IG reel"
        ? p.reelMotion?.isStatic
          ? "Static Reel"
          : "Video Reel"
        : p.postType === "IG image"
          ? "Bild"
          : "Carousel";
    const caption = (p.description?.description ?? "").slice(0, 80);
    rows.push(
      `| [${dateShort}](${p.permalink}) | ${cat} | ${format} | ${fmtNum(p.reach)} | ${fmtPct(p.engagementRate)} | ${p.saves} | ${caption} |`,
    );
  }
  return rows.join("\n");
}

function renderLowPerformers(posts: JoinedPost[]): string {
  const sorted = [...posts].sort((a, b) => a.reach - b.reach);
  const bottom = sorted.slice(0, 10);
  const rows: string[] = [
    "| Datum | Kategorie | Format | Reach | ER | Beschreibung |",
    "|---|---|---|---:|---:|---|",
  ];
  for (const p of bottom) {
    const dateShort = (p.publishedAt || "").split(" ")[0];
    const cat = p.classification?.primaryCategory ?? "—";
    const format =
      p.postType === "IG reel"
        ? p.reelMotion?.isStatic
          ? "Static Reel"
          : "Video Reel"
        : p.postType === "IG image"
          ? "Bild"
          : "Carousel";
    const caption = (p.description?.description ?? "").slice(0, 80);
    rows.push(
      `| [${dateShort}](${p.permalink}) | ${cat} | ${format} | ${fmtNum(p.reach)} | ${fmtPct(p.engagementRate)} | ${caption} |`,
    );
  }
  return rows.join("\n");
}

function main() {
  const { posts, categories } = joinData();
  console.log(`Loaded ${posts.length} posts, ${categories.length} categories`);

  const stats = aggregateByCategory(posts, categories);

  const totalPosts = posts.length;
  const totalReach = posts.reduce((a, b) => a + b.reach, 0);
  const totalNewFollowers = posts.reduce((a, b) => a + b.newFollowers, 0);

  const sections: string[] = [
    "# Instagram Content-Analyse — Pfarre Emmaus am Wienerberger",
    "",
    `_Zeitraum: Mai 2025 – April 2026 · ${totalPosts} Posts · Gesamtreichweite ${fmtNum(totalReach)} · ${totalNewFollowers} neue Follower_`,
    "",
    "## Format-Vergleich",
    "",
    "Wie schneiden die verschiedenen Content-Formate ab? Insbesondere: zahlt sich der Aufwand für echte Videos gegenüber Static-Reels (Foto mit Musik) aus?",
    "",
    renderMotionAnalysis(posts),
    "",
    "## Kategorien — sortiert nach Median Engagement Rate",
    "",
    renderCategoryTable(stats),
    "",
    "## Top 10 Posts nach Reach",
    "",
    renderBiggestWins(posts),
    "",
    "## Bottom 10 Posts nach Reach (Was funktioniert nicht?)",
    "",
    renderLowPerformers(posts),
    "",
    "## Detail-Ansicht je Kategorie",
    "",
    renderCategoryDetails(stats, categories),
  ];

  const outputDir = REPORT_FILE.replace(/\/[^/]+$/, "");
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  writeFileSync(REPORT_FILE, sections.join("\n"));

  const joinedJson = posts.map((p) => ({
    postId: p.postId,
    date: p.date,
    permalink: p.permalink,
    postType: p.postType,
    reach: p.reach,
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    saves: p.saves,
    shares: p.shares,
    newFollowers: p.newFollowers,
    engagementRate: p.engagementRate,
    isStaticReel: p.reelMotion?.isStatic ?? null,
    primaryCategory: p.classification?.primaryCategory ?? null,
    secondaryCategories: p.classification?.secondaryCategories ?? [],
    themes: p.description?.themes ?? [],
    description: p.description?.description ?? "",
  }));
  writeFileSync(DATA_FILE, JSON.stringify(joinedJson, null, 2));

  console.log(`\nReport:      ${REPORT_FILE}`);
  console.log(`Joined data: ${DATA_FILE}`);
}

main();
