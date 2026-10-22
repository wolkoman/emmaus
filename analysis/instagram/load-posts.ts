import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { InstagramPost, PostType, ReelMotion, MotionClass } from "./types";

const CSV_PATH =
  "/Users/manuel/Projects/emmaus/May-01-2025_Apr-18-2026_1718281115821371.csv";
const SCRAPE_DIR =
  "/Users/manuel/Projects/emmaus/instagram-scrape/pfarreemmaus";
const THUMBNAIL_DIR =
  "/Users/manuel/Projects/emmaus/instagram-scrape/thumbnails";
const REEL_MOTION_PATH =
  "/Users/manuel/Projects/emmaus/analysis/instagram/cache/reel-motion.json";

type RawReelMotion = {
  duration?: number;
  max_distance?: number;
  avg_distance?: number;
  is_static?: boolean;
};

let _reelMotionCache: Record<string, RawReelMotion> | null = null;

function loadReelMotion(): Record<string, RawReelMotion> {
  if (_reelMotionCache) return _reelMotionCache;
  if (!existsSync(REEL_MOTION_PATH)) {
    _reelMotionCache = {};
    return _reelMotionCache;
  }
  _reelMotionCache = JSON.parse(readFileSync(REEL_MOTION_PATH, "utf-8"));
  return _reelMotionCache!;
}

function classifyMotion(maxDistance: number): MotionClass {
  if (maxDistance <= 6) return "static";
  if (maxDistance <= 15) return "slight";
  return "motion";
}

const SHORTCODE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function shortcodeToMediaId(shortcode: string): string {
  let result = 0;
  for (const ch of shortcode) {
    const index = SHORTCODE_ALPHABET.indexOf(ch);
    if (index < 0) return "";
    result = result * 64n + BigInt(index);
  }
  return result.toString();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(cell);
        cell = "";
      } else if (ch === "\n") {
        current.push(cell);
        rows.push(current);
        current = [];
        cell = "";
      } else if (ch === "\r") {
        continue;
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }
  return rows;
}

function toInt(s: string): number {
  const n = parseInt(s.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export function loadPostsFromCsv(): InstagramPost[] {
  const raw = readFileSync(CSV_PATH, "utf-8").replace(/^\uFEFF/, "");
  const rows = parseCsv(raw);
  const [header, ...dataRows] = rows;
  const idx = (name: string) => header.findIndex((h) => h === name);

  const cols = {
    postId: idx("Beitrags-ID"),
    username: idx("Nutzername des Kontos"),
    accountName: idx("Kontoname"),
    description: idx("Beschreibung"),
    duration: idx("Dauer (Sek.)"),
    publishedAt: idx("Veröffentlichungszeit"),
    permalink: idx("Permalink"),
    postType: idx("Beitragsart"),
    date: idx("Datum"),
    views: idx("Aufrufe"),
    reach: idx("Reichweite"),
    likes: idx("„Gefällt mir“-Angaben"),
    shares: idx("Geteilte Inhalte"),
    newFollowers: idx("Neue Follower"),
    comments: idx("Kommentare"),
    saves: idx("Gespeicherte Inhalte"),
  };

  const motionMap = loadReelMotion();

  const posts: InstagramPost[] = [];
  for (const row of dataRows) {
    if (!row[cols.postId]) continue;
    const duration = row[cols.duration]?.trim();
    const permalink = row[cols.permalink];
    const postType = row[cols.postType] as PostType;

    let reelMotion: ReelMotion | null = null;
    if (postType === "IG reel") {
      const shortcode = extractShortcodeFromPermalink(permalink);
      const mediaId = shortcode ? shortcodeToMediaId(shortcode) : null;
      const raw = mediaId ? motionMap[mediaId] : undefined;
      if (raw && raw.max_distance !== undefined) {
        reelMotion = {
          duration: raw.duration ?? 0,
          maxDistance: raw.max_distance,
          avgDistance: raw.avg_distance ?? 0,
          isStatic: raw.is_static ?? false,
          motionClass: classifyMotion(raw.max_distance),
        };
      } else {
        reelMotion = {
          duration: 0,
          maxDistance: 0,
          avgDistance: 0,
          isStatic: false,
          motionClass: "unknown",
        };
      }
    }

    posts.push({
      postId: row[cols.postId],
      username: row[cols.username],
      accountName: row[cols.accountName],
      description: row[cols.description] ?? "",
      durationSeconds: duration ? toInt(duration) : null,
      publishedAt: row[cols.publishedAt],
      permalink,
      postType,
      date: row[cols.date],
      views: toInt(row[cols.views] ?? "0"),
      reach: toInt(row[cols.reach] ?? "0"),
      likes: toInt(row[cols.likes] ?? "0"),
      shares: toInt(row[cols.shares] ?? "0"),
      newFollowers: toInt(row[cols.newFollowers] ?? "0"),
      comments: toInt(row[cols.comments] ?? "0"),
      saves: toInt(row[cols.saves] ?? "0"),
      reelMotion,
    });
  }
  return posts;
}

export function extractShortcodeFromPermalink(
  permalink: string,
): string | null {
  const match = permalink.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

let _scrapeFilesCache: string[] | null = null;
let _thumbnailFilesCache: string[] | null = null;

function listScrapeFiles(): string[] {
  if (!_scrapeFilesCache) {
    _scrapeFilesCache = existsSync(SCRAPE_DIR) ? readdirSync(SCRAPE_DIR) : [];
  }
  return _scrapeFilesCache;
}

function listThumbnailFiles(): string[] {
  if (!_thumbnailFilesCache) {
    _thumbnailFilesCache = existsSync(THUMBNAIL_DIR)
      ? readdirSync(THUMBNAIL_DIR)
      : [];
  }
  return _thumbnailFilesCache;
}

export function findImageForPost(permalink: string): string | null {
  const shortcode = extractShortcodeFromPermalink(permalink);
  if (!shortcode) return null;
  const mediaId = shortcodeToMediaId(shortcode);
  if (!mediaId) return null;

  const thumbName = `${mediaId}.jpg`;
  if (listThumbnailFiles().includes(thumbName)) {
    return join(THUMBNAIL_DIR, thumbName);
  }

  const files = listScrapeFiles();
  const direct = files.find(
    (f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && f.startsWith(`${mediaId}.`),
  );
  if (direct) return join(SCRAPE_DIR, direct);

  const carouselSorted = files
    .filter(
      (f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && f.startsWith(`${mediaId}_`),
    )
    .sort();
  if (carouselSorted.length > 0) return join(SCRAPE_DIR, carouselSorted[0]);

  return null;
}

export function computeEngagementRate(post: InstagramPost): number {
  const denom = post.reach || post.views || 1;
  return (post.likes + post.comments + post.shares + post.saves) / denom;
}
