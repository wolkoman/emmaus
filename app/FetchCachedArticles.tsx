import { fetchArticles } from "@/app/(domain)/content/content-repo";
import { Links } from "@/app/(shared)/Links";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import sanitize from "sanitize-html";

// Cards clamp the caption to 5 lines, so shipping the full article body only bloats every ISR write.
function excerpt(html: string, maxLength = 500): string {
  const text = sanitize(
    html.replace(/<\/(p|div|h[1-6]|li)>|<br\s*\/?>/gi, " "),
    { allowedTags: [] },
  )
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, text.lastIndexOf(" ", maxLength)) + " …";
}

export async function fetchCachedArticles() {
  "use cache";
  cacheLife("hours");

  return await fetchArticles().then((x) =>
    x
      // `title_slug` is no longer part of the URL, but an empty one is still the
      // only usable "never published" marker in the imported data: the six
      // articles without it are all Cockpit-era drafts. (`public` can't be used
      // for this — it's false on 93 of the 145 articles that are live today.)
      .filter(
        (x) => x.title_slug && x._created > Date.parse("2023-01-01") / 1000,
      )
      .filter((x, i, all) => all.findIndex((y) => x._id === y._id) === i)
      .map((x) => ({
        id: x._id,
        slug: Links.Artikel(x),
        title: x.title,
        image: x.imageUrl,
        date: x._created,
        caption: excerpt(x.content),
        impuls: true,
      })),
  );
}
