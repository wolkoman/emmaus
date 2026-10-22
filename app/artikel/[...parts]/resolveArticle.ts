import {
  fetchArticleIndex,
  type ArticleIndexEntry,
} from "@/app/(domain)/content/content-repo";
import { Links } from "@/app/(shared)/Links";
import { slugifyTitle } from "@/app/(shared)/slugify";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { notFound, permanentRedirect, redirect } from "next/navigation";

/**
 * The id/slug index, cached so that `resolveArticle` can be awaited in the page
 * body rather than inside `<Suspense>`.
 *
 * That placement is what makes the redirects and 404s below real HTTP statuses:
 * `cacheComponents` streams the shell before uncached IO resolves, and once the
 * shell is flushed the status can no longer be corrected. Cached reads are
 * exempt from that rule.
 *
 * Short lifetime on purpose — it decides whether a URL exists at all, so a newly
 * published article should become reachable within a minute rather than after
 * the `hours` the article feed uses.
 */
async function cachedArticleIndex(): Promise<ArticleIndexEntry[]> {
  "use cache";
  cacheLife("minutes");
  return await fetchArticleIndex();
}

/**
 * Next hands catch-all segments to `params` still percent-encoded, and plenty of
 * legacy `title_slug` values contain umlauts or spaces ("plan-für-lockdown",
 * "Sternsinger 2020"), so they have to be decoded before they can be matched.
 */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // Malformed percent-encoding: keep the raw value, which simply won't match.
    return segment;
  }
}

export type ArticleLookup =
  | { kind: "canonical"; article: ArticleIndexEntry }
  | { kind: "redirect"; article: ArticleIndexEntry; permanent: boolean }
  | { kind: "unknown" };

/**
 * Matches `/artikel/...` against the article index without acting on the
 * result, so `generateMetadata` can emit a title and a canonical link even for
 * a URL whose body will redirect.
 *
 * The id is the only thing looked up; the trailing slug is display-only and
 * derived from the current title. That keeps every link an editor ever shared
 * valid, no matter how often the title is edited afterwards.
 *
 * Accepted shapes:
 *   /artikel/<id>/<slug>   canonical — rendered (slug corrected if stale)
 *   /artikel/<id>          redirected to the canonical URL
 *   /artikel/<title-slug>  legacy Cockpit-era links, redirected permanently
 *
 * The id is the PB record id. Only `title_slug` still carries Cockpit-era
 * values, and purely as a redirect lookup table — `proxy.ts` normally answers
 * those links with a real 308 before the route is reached, so the branch below
 * is just a safety net for slugs missing from its generated table.
 */
export async function lookupArticle(parts: string[]): Promise<ArticleLookup> {
  const [rawId, rawSlug, ...rest] = parts;
  if (!rawId || rest.length > 0) return { kind: "unknown" };

  const id = decodeSegment(rawId);
  const slug = rawSlug === undefined ? undefined : decodeSegment(rawSlug);

  const index = await cachedArticleIndex();
  const article = index.find((a) => a._id === id);

  if (!article) {
    // A two-segment URL whose first segment isn't a known id is simply wrong;
    // only the one-segment form can be a legacy `title_slug` link.
    if (slug !== undefined) return { kind: "unknown" };

    const legacy = index.find((a) => a.title_slug === id);
    if (!legacy) return { kind: "unknown" };

    // These are the URLs search engines and old newsletters point at, so
    // consolidate them onto the canonical one for good.
    return { kind: "redirect", article: legacy, permanent: true };
  }

  if (slug !== slugifyTitle(article.title)) {
    // Not permanent: the target embeds the current title, and caching it
    // forever would pin outdated titles into long redirect chains.
    return { kind: "redirect", article, permanent: false };
  }

  return { kind: "canonical", article };
}

/**
 * `lookupArticle`, but 404s or redirects to the canonical URL instead of
 * reporting back. Note that the route flushes its shell before this runs, so
 * both only take effect client-side — see the comment in `page.tsx`.
 */
export async function resolveArticle(
  parts: string[],
): Promise<ArticleIndexEntry> {
  const found = await lookupArticle(parts);
  if (found.kind === "unknown") notFound();
  if (found.kind === "redirect") {
    const target = Links.Artikel(found.article);
    if (found.permanent) permanentRedirect(target);
    redirect(target);
  }
  return found.article;
}
