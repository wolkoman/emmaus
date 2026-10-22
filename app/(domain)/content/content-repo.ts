import type {
  ArticlesResponse,
  ImpressumResponse,
  SitesResponse,
} from "@/pb/pocketbase-types";
import { pb } from "@/util/pocketbase";
import { pbFileUrl } from "@/util/pb-files";

/**
 * Pocketbase data access for the public website content (formerly Cockpit's
 * `site`, `articles` collections and the `impressum`
 * internal-data singleton). PB-only — this slice is fully cut over.
 *
 * Timestamp mapping (`sites`): Cockpit's original
 * `_created`/`_modified` are shown on the public site, and PB's autodate fields
 * were reset at import time. The import therefore stored the originals in
 * `cockpit_created` / `cockpit_modified` (epoch seconds). Until a record is
 * edited in the PB admin (detectable via `updated != created`), those take
 * precedence; after an edit, PB's own `updated` wins.
 *
 * `articles` no longer works that way: its publication date is plain PB
 * `created` and its public id is the plain PB `id` — see the
 * `articles_publish_date` migration.
 */

function isNotFound(err: unknown): boolean {
  return (
    !!err && typeof err === "object" && "status" in err && err.status === 404
  );
}

const toEpochSeconds = (iso: string): number =>
  iso ? Math.floor(new Date(iso).getTime() / 1000) : 0;

function modifiedOf(rec: {
  created: string;
  updated: string;
  cockpit_modified?: number;
}): number {
  const edited = rec.updated !== rec.created;
  return edited
    ? toEpochSeconds(rec.updated)
    : rec.cockpit_modified || toEpochSeconds(rec.updated);
}

// ---------------------------------------------------------------------------
// Sites (page tree under /[slug])
// ---------------------------------------------------------------------------

export type SiteNode = {
  _id: string;
  name: string;
  slug: string;
  title: string;
  summary: string;
  icon: string;
  html: string;
  _modified: number;
  children: SiteNode[];
};

export type SiteStructure = SiteNode & {
  parent: SiteNode | null;
  level: number;
};

/**
 * The flattened site tree below the "emmaus.wien" root, in the same shape
 * the Cockpit-era `fetchEmmausSites` produced (parent/level enrichment,
 * children ordered by their original Cockpit order).
 */
export async function fetchSiteStructure(): Promise<SiteStructure[]> {
  const client = await pb();
  const rows = (await client
    .collection("sites")
    .getFullList({ sort: "sort_order" })) as SitesResponse[];
  if (!rows.length) return [];

  const nodes = new Map<string, SiteNode>();
  for (const row of rows) {
    nodes.set(row.id, {
      _id: row.cockpit_id || row.id,
      name: row.name,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      icon: row.icon,
      html: row.html,
      _modified: modifiedOf(row),
      children: [],
    });
  }
  for (const row of rows) {
    if (row.parent) nodes.get(row.parent)?.children.push(nodes.get(row.id)!);
  }

  const root = rows.find((r) => r.name === "emmaus.wien");
  if (!root) return [];

  const result: SiteStructure[] = [];
  function traverse(site: SiteNode, parent: SiteNode | null, level: number) {
    const enriched = { ...site, parent, level };
    result.push(enriched);
    site.children.forEach((child) => traverse(child, enriched, level + 1));
  }
  nodes.get(root.id)!.children.forEach((c) => traverse(c, null, 0));
  return result;
}

// ---------------------------------------------------------------------------
// Articles ("Beiträge")
// ---------------------------------------------------------------------------

export type ContentArticle = {
  _id: string;
  _created: number;
  title: string;
  title_slug: string;
  author: string;
  content: string;
  /** Full public URL of the preview image ("" when none). */
  imageUrl: string;
  public: boolean;
};

function toContentArticle(a: ArticlesResponse): ContentArticle {
  return {
    _id: a.id,
    _created: toEpochSeconds(a.created),
    title: a.title,
    title_slug: a.title_slug,
    author: a.author,
    content: a.content,
    imageUrl: a.image ? pbFileUrl("articles", a.id, a.image) : "",
    public: a.public,
  };
}

/**
 * All articles, newest first.
 *
 * `created` is the publication date (see the `articles_publish_date`
 * migration). Backfilled dates are day-precision, so a fair number of articles
 * share a timestamp — `-id` only breaks those ties deterministically.
 */
export async function fetchArticles(): Promise<ContentArticle[]> {
  const client = await pb();
  const rows = (await client
    .collection("articles")
    .getFullList({ sort: "-created,-id" })) as ArticlesResponse[];
  return rows.map(toContentArticle);
}

/**
 * Just enough of every article to resolve a URL: map an id or a legacy
 * `title_slug` to the article and derive its canonical slug from the title.
 *
 * Deliberately selects three columns instead of reusing `fetchArticles()`, so
 * the route can keep this cached with a short lifetime without transferring all
 * article bodies on every revalidation.
 */
export type ArticleIndexEntry = {
  _id: string;
  title: string;
  title_slug: string;
};

export async function fetchArticleIndex(): Promise<ArticleIndexEntry[]> {
  const client = await pb();
  const rows = await client
    .collection("articles")
    .getFullList({ fields: "id,title,title_slug" });
  return (rows as unknown as ArticlesResponse[]).map((a) => ({
    _id: a.id,
    title: a.title,
    title_slug: a.title_slug,
  }));
}

/**
 * Look up an article by its PB id — the `_id` exposed by `ContentArticle` and
 * used in `/artikel/<id>/<slug>` URLs.
 */
export async function fetchArticleById(
  id: string,
): Promise<ContentArticle | undefined> {
  const client = await pb();
  try {
    const rec = await client.collection("articles").getOne(id);
    return toContentArticle(rec as ArticlesResponse);
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

/**
 * Look up an article by the legacy Cockpit `title_slug`. Only used to redirect
 * old `/artikel/<title-slug>` links to their canonical id-based URL.
 */
export async function fetchArticleBySlug(
  slug: string,
): Promise<ContentArticle | undefined> {
  const client = await pb();
  try {
    const rec = await client
      .collection("articles")
      .getFirstListItem(client.filter("title_slug = {:slug}", { slug }));
    return toContentArticle(rec as ArticlesResponse);
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Impressum (single-row collection)
// ---------------------------------------------------------------------------

export async function fetchImpressum(): Promise<{
  title: string;
  content: string;
}> {
  const client = await pb();
  const page = await client.collection("impressum").getList(1, 1);
  const rec = page.items[0] as ImpressumResponse | undefined;
  return { title: rec?.title ?? "", content: rec?.content ?? "" };
}
