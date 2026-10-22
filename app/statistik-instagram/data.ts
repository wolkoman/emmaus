import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CACHE_DIR = join(process.cwd(), "analysis/instagram/cache");
const OUTPUT_DIR = join(process.cwd(), "analysis/instagram/output");

const SHORTCODE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function shortcodeToMediaId(shortcode: string): string {
  let result = 0n;
  for (const ch of shortcode) {
    const index = SHORTCODE_ALPHABET.indexOf(ch);
    if (index < 0) return "";
    result = result * 64n + BigInt(index);
  }
  return result.toString();
}

export function extractShortcode(permalink: string): string | null {
  const match = permalink.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export interface JoinedPost {
  postId: string;
  date: string;
  permalink: string;
  postType: "IG reel" | "IG image" | "IG carousel";
  reach: number;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  newFollowers: number;
  engagementRate: number;
  isStaticReel: boolean | null;
  primaryCategory: string | null;
  secondaryCategories: string[];
  themes: string[];
  description: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

export interface Taxonomy {
  categories: Category[];
  rationale: string;
}

let _posts: JoinedPost[] | null = null;
let _taxonomy: Taxonomy | null = null;
let _thumbManifest: Record<string, string> | null = null;

const THUMB_MANIFEST_PATH = join(
  process.cwd(),
  "public/ig-thumbs/manifest.json",
);

function loadThumbManifest(): Record<string, string> {
  if (!_thumbManifest) {
    try {
      _thumbManifest = JSON.parse(readFileSync(THUMB_MANIFEST_PATH, "utf-8"));
    } catch {
      _thumbManifest = {};
    }
  }
  return _thumbManifest!;
}

export function getThumbUrl(
  post: Pick<JoinedPost, "permalink">,
): string | null {
  const mediaId = getMediaIdForPost(post);
  if (!mediaId) return null;
  return loadThumbManifest()[mediaId] ?? null;
}

export function loadPosts(): JoinedPost[] {
  if (!_posts) {
    _posts = JSON.parse(
      readFileSync(join(OUTPUT_DIR, "joined-data.json"), "utf-8"),
    );
  }
  return _posts!;
}

export function loadTaxonomy(): Taxonomy {
  if (!_taxonomy) {
    _taxonomy = JSON.parse(
      readFileSync(join(CACHE_DIR, "categories.json"), "utf-8"),
    );
  }
  return _taxonomy!;
}

export function categoryById(id: string): Category | undefined {
  return loadTaxonomy().categories.find((c) => c.id === id);
}

export function getMediaIdForPost(
  post: Pick<JoinedPost, "permalink">,
): string | null {
  const sc = extractShortcode(post.permalink);
  if (!sc) return null;
  const id = shortcodeToMediaId(sc);
  return id || null;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + "%";
}

export function fmtNum(n: number): string {
  return n.toLocaleString("de-AT", { maximumFractionDigits: 0 });
}

export function fmtDate(date: string): string {
  // CSV has MM/DD/YYYY HH:MM
  const [datePart] = date.split(" ");
  const [m, d, y] = datePart.split("/");
  if (!m || !d || !y) return date;
  return `${d}.${m}.${y}`;
}

export interface FormatStats {
  label: string;
  slug: string;
  count: number;
  medianReach: number;
  medianViews: number;
  medianEngagementRate: number;
  medianSaves: number;
  totalNewFollowers: number;
}

export function formatBuckets(posts: JoinedPost[]): FormatStats[] {
  const buckets = [
    {
      label: "Static Reels (Foto + Musik)",
      slug: "static-reel",
      items: posts.filter(
        (p) => p.postType === "IG reel" && p.isStaticReel === true,
      ),
    },
    {
      label: "Echte Video Reels",
      slug: "video-reel",
      items: posts.filter(
        (p) => p.postType === "IG reel" && p.isStaticReel === false,
      ),
    },
    {
      label: "Bilder",
      slug: "image",
      items: posts.filter((p) => p.postType === "IG image"),
    },
    {
      label: "Carousels",
      slug: "carousel",
      items: posts.filter((p) => p.postType === "IG carousel"),
    },
  ];
  return buckets
    .filter((b) => b.items.length > 0)
    .map((b) => ({
      label: b.label,
      slug: b.slug,
      count: b.items.length,
      medianReach: median(b.items.map((p) => p.reach)),
      medianViews: median(b.items.map((p) => p.views)),
      medianEngagementRate: median(b.items.map((p) => p.engagementRate)),
      medianSaves: median(b.items.map((p) => p.saves)),
      totalNewFollowers: b.items.reduce((a, b) => a + b.newFollowers, 0),
    }));
}

export interface CategoryStats {
  id: string;
  name: string;
  description: string;
  posts: JoinedPost[];
  medianReach: number;
  medianViews: number;
  medianLikes: number;
  medianEngagementRate: number;
  medianSaves: number;
  totalNewFollowers: number;
  staticReelsPct: number;
  videoReelsPct: number;
  top3: JoinedPost[];
}

export function normalizeCategoryId(
  id: string | null | undefined,
  validIds: Set<string>,
): string | null {
  if (!id) return null;
  const stripped = id.replace(/^\[|\]$/g, "").trim();
  return validIds.has(stripped) ? stripped : validIds.has(id) ? id : null;
}

export function categoryBuckets(posts: JoinedPost[]): CategoryStats[] {
  const taxonomy = loadTaxonomy();
  const validIds = new Set(taxonomy.categories.map((c) => c.id));
  const nameById = new Map(taxonomy.categories.map((c) => [c.id, c.name]));
  const descById = new Map(
    taxonomy.categories.map((c) => [c.id, c.description]),
  );

  const byId = new Map<string, JoinedPost[]>();
  for (const cat of taxonomy.categories) byId.set(cat.id, []);

  for (const p of posts) {
    const id =
      normalizeCategoryId(p.primaryCategory, validIds) ?? "uncategorized";
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id)!.push(p);
  }

  const stats: CategoryStats[] = [];
  for (const [id, catPosts] of byId.entries()) {
    const reels = catPosts.filter((p) => p.postType === "IG reel");
    const staticReels = reels.filter((p) => p.isStaticReel === true).length;
    const sorted = [...catPosts].sort(
      (a, b) => b.engagementRate - a.engagementRate,
    );
    stats.push({
      id,
      name: nameById.get(id) ?? id,
      description: descById.get(id) ?? "",
      posts: catPosts,
      medianReach: median(catPosts.map((p) => p.reach)),
      medianViews: median(catPosts.map((p) => p.views)),
      medianLikes: median(catPosts.map((p) => p.likes)),
      medianEngagementRate: median(catPosts.map((p) => p.engagementRate)),
      medianSaves: median(catPosts.map((p) => p.saves)),
      totalNewFollowers: catPosts.reduce((a, b) => a + b.newFollowers, 0),
      staticReelsPct: reels.length > 0 ? staticReels / reels.length : 0,
      videoReelsPct:
        reels.length > 0 ? (reels.length - staticReels) / reels.length : 0,
      top3: sorted.slice(0, 3),
    });
  }

  return stats.sort((a, b) => b.medianEngagementRate - a.medianEngagementRate);
}

export function getPostsForCategory(categoryId: string): JoinedPost[] {
  const taxonomy = loadTaxonomy();
  const validIds = new Set(taxonomy.categories.map((c) => c.id));
  return loadPosts().filter(
    (p) => normalizeCategoryId(p.primaryCategory, validIds) === categoryId,
  );
}

export function postsByReach(posts: JoinedPost[], direction: "desc" | "asc") {
  return [...posts].sort((a, b) =>
    direction === "desc" ? b.reach - a.reach : a.reach - b.reach,
  );
}

export function formatLabel(post: JoinedPost): string {
  if (post.postType === "IG reel") {
    return post.isStaticReel ? "Static Reel" : "Video Reel";
  }
  if (post.postType === "IG image") return "Bild";
  return "Carousel";
}

export function overviewStats(posts: JoinedPost[]) {
  return {
    totalPosts: posts.length,
    totalReach: posts.reduce((a, b) => a + b.reach, 0),
    totalNewFollowers: posts.reduce((a, b) => a + b.newFollowers, 0),
    totalLikes: posts.reduce((a, b) => a + b.likes, 0),
    totalComments: posts.reduce((a, b) => a + b.comments, 0),
  };
}
