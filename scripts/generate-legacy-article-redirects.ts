/**
 * Regenerates `app/artikel/legacy-slug-redirects.ts`, the lookup table that
 * `proxy.ts` uses to answer old `/artikel/<title-slug>` links with a real 308.
 *
 * The table is checked in rather than queried at runtime because it is frozen
 * history: `title_slug` is a Cockpit-era key, Cockpit is retired, and articles
 * created since then are only ever linked by their id. Keeping it in the repo
 * means the redirect costs a Map lookup in middleware instead of a database
 * round trip, and it stays reviewable in the diff.
 *
 * Usage (against prod, credentials come from .env):
 *   POCKETBASE_URL=https://db.emmaus.wien bun scripts/generate-legacy-article-redirects.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { format, resolveConfig } from "prettier";
import { fetchArticleIndex } from "../app/(domain)/content/content-repo";
import { slugifyTitle } from "../app/(shared)/slugify";

const OUT = join(
  import.meta.dirname,
  "..",
  "app",
  "artikel",
  "legacy-slug-redirects.ts",
);

async function main() {
  const index = await fetchArticleIndex();
  const ids = new Set(index.map((a) => a._id));

  const entries: [string, string][] = [];
  for (const article of index) {
    const legacy = article.title_slug;
    if (!legacy) continue; // Cockpit-era drafts, never published
    // An id always wins in `/artikel/<segment>`, so a legacy slug shaped like
    // one would be unreachable. None exist today; fail loudly if that changes.
    if (ids.has(legacy)) {
      throw new Error(`title_slug "${legacy}" collides with an article id`);
    }
    entries.push([legacy, `${article._id}/${slugifyTitle(article.title)}`]);
  }

  const seen = new Set<string>();
  for (const [legacy] of entries) {
    if (seen.has(legacy)) throw new Error(`duplicate title_slug "${legacy}"`);
    seen.add(legacy);
  }

  entries.sort(([a], [b]) => a.localeCompare(b, "de"));

  const body = entries
    .map(
      ([legacy, target]) =>
        `  ${JSON.stringify(legacy)}: ${JSON.stringify(target)},`,
    )
    .join("\n");

  const source = `/**
 * Old Cockpit-era article URLs (\`/artikel/<title-slug>\`) mapped to the tail of
 * their canonical URL (\`<id>/<slug>\`). Used by \`proxy.ts\` to serve those links
 * a real 308 instead of a client-side redirect.
 *
 * GENERATED — do not edit by hand. Run
 * \`POCKETBASE_URL=https://db.emmaus.wien bun scripts/generate-legacy-article-redirects.ts\`
 * to refresh it. Regenerating is only necessary if an article's title_slug
 * changes; the slug in the target is display-only, and the route corrects a
 * stale one itself.
 */
export const legacyArticleSlugs: Record<string, string> = {
${body}
};
`;

  // Formatted here so that re-running this script is a no-op in a clean tree
  // (several entries are longer than the print width and get wrapped).
  const options = await resolveConfig(OUT);
  writeFileSync(
    OUT,
    await format(source, { ...options, filepath: OUT }),
    "utf8",
  );

  console.log(`wrote ${entries.length} legacy redirects to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
