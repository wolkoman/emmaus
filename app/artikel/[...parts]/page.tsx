import { fetchArticleById } from "@/app/(domain)/content/content-repo";
import {
  lookupArticle,
  resolveArticle,
} from "@/app/artikel/[...parts]/resolveArticle";
import { fetchCachedArticles } from "@/app/FetchCachedArticles";
import { Links } from "@/app/(shared)/Links";
import { Article as ArticleSite } from "@/components/Article";
import { RenderCpWysiwyg } from "@/components/renderCpLayout";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type ArticleParams = { params: Promise<{ parts: string[] }> };

export async function generateMetadata(
  props: ArticleParams,
): Promise<Metadata> {
  const { parts } = await props.params;
  // Deliberately the non-throwing lookup: a URL whose body redirects still has
  // to emit metadata, otherwise crawlers following an old link would get a page
  // with neither a title nor a canonical link.
  const found = await lookupArticle(parts);
  if (found.kind === "unknown") return {};
  return {
    title: found.article.title,
    // Every historical URL of an article resolves to the same content, so point
    // search engines at the canonical one.
    alternates: { canonical: Links.Artikel(found.article) },
  };
}

async function ArticleBody({
  partsPromise,
}: {
  partsPromise: Promise<string[]>;
}) {
  const resolved = await resolveArticle(await partsPromise);
  const [article, allArticles] = await Promise.all([
    fetchArticleById(resolved._id),
    fetchCachedArticles(),
  ]);
  // Only reachable if the article disappeared between the cached index and here.
  if (!article) notFound();

  const suggestedArticles = allArticles
    .filter((a) => a.id !== article._id)
    .slice(0, 3);

  return (
    <ArticleSite
      image={article.imageUrl}
      title={article.title}
      created={article._created}
      author={article.author}
      suggestedArticles={suggestedArticles}
    >
      <RenderCpWysiwyg content={article.content} />
    </ArticleSite>
  );
}

/**
 * `cacheComponents` requires the `params` access to sit inside a `<Suspense>`
 * boundary (the same shape `app/[slug]` uses). The shell is therefore already
 * flushed as a 200 by the time `resolveArticle` runs, so its redirects reach the
 * browser as client-side navigations rather than 307/308 responses, and an
 * unknown article renders the not-found UI under a 200.
 *
 * The URLs where that actually matters — the indexed Cockpit-era links — are
 * therefore redirected in `proxy.ts` instead, which does produce a 308. What is
 * left here is the rare stale-slug or id-only link: users land on the canonical
 * URL, and `generateMetadata` emits the canonical link for crawlers.
 */
export default async function Article(props: ArticleParams) {
  return (
    <Suspense>
      <ArticleBody partsPromise={props.params.then((p) => p.parts)} />
    </Suspense>
  );
}
