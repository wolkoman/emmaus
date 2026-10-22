import { fetchCachedArticles } from "@/app/FetchCachedArticles";
import Site from "@/components/Site";
import { ArticleCard } from "@/app/ArticleCard";
import { SanitizeHTML } from "@/components/SanitizeHtml";
import Link from "next/link";

export default async function Article() {
  const articles = await fetchCachedArticles();
  const main = articles[0];
  if (!main)
    return (
      <Site title="Beiträge" showTitle>
        <div />
      </Site>
    );
  return (
    <Site title="Beiträge" showTitle>
      <Link
        href={main.slug}
        className="mb-20 grid min-h-[300px] overflow-hidden rounded-md border border-black/10 hover:border-black/20 lg:grid-cols-2"
      >
        <div
          className="min-h-[200px] bg-cover bg-center"
          style={{ backgroundImage: `url(${main.image})` }}
        ></div>
        <div className="flex flex-col gap-4 p-4 lg:p-10">
          <div className="text-3xl font-semibold">{main.title}</div>
          <SanitizeHTML
            textOnly
            html={main.caption}
            className="line-clamp-5 max-w-lg overflow-hidden"
          />
        </div>
      </Link>
      <div className="grid gap-8 lg:grid-cols-3">
        {articles.slice(1).map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </Site>
  );
}
