import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { loadPostsFromCsv, findImageForPost } from "./load-posts";

const PUBLIC_DIR = "/Users/manuel/Projects/emmaus/public/ig-thumbs";

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

function extractShortcode(permalink: string): string | null {
  const match = permalink.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

async function main() {
  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

  const posts = loadPostsFromCsv();
  let copied = 0;
  let skipped = 0;
  let missing = 0;

  for (const post of posts) {
    const shortcode = extractShortcode(post.permalink);
    if (!shortcode) continue;
    const mediaId = shortcodeToMediaId(shortcode);
    if (!mediaId) continue;

    const source = findImageForPost(post.permalink);
    if (!source) {
      missing++;
      continue;
    }

    const ext = source.split(".").pop()!.toLowerCase();
    const target = join(
      PUBLIC_DIR,
      `${mediaId}.${ext === "jpeg" ? "jpg" : ext}`,
    );

    if (existsSync(target)) {
      skipped++;
      continue;
    }

    copyFileSync(source, target);
    copied++;
  }

  const files = readdirSync(PUBLIC_DIR).filter((f) =>
    /\.(jpg|jpeg|png|webp)$/i.test(f),
  );
  const totalSize = files.reduce(
    (acc, f) => acc + statSync(join(PUBLIC_DIR, f)).size,
    0,
  );

  const manifest = files.reduce<Record<string, string>>((acc, f) => {
    const mediaId = f.replace(/\.[^.]+$/, "");
    acc[mediaId] = `/ig-thumbs/${f}`;
    return acc;
  }, {});
  writeFileSync(
    join(PUBLIC_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log(`Copied: ${copied}`);
  console.log(`Already existed: ${skipped}`);
  console.log(`Missing source: ${missing}`);
  console.log(`Files in public/ig-thumbs: ${files.length}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Manifest: ${PUBLIC_DIR}/manifest.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
