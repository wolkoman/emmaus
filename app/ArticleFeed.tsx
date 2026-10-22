import { Links } from "@/app/(shared)/Links";
import { ArticleCard } from "@/app/ArticleCard";
import { fetchCachedArticles } from "@/app/FetchCachedArticles";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function ArticleFeed() {
  const items = (await fetchCachedArticles()).slice(0, 3);
  return (
    <>
      <div className="mt-32 mb-8 items-end justify-between lg:flex">
        <div className="text-3xl">
          Entdecke die neuesten Berichte aus unserer Pfarre. <br />
          <div className="font-bold">Ein Blick lohnt sich!</div>
        </div>
        <Link href={Links.Artikel()}>
          <Button variant="link" className="-mx-4">
            Alle Beiträge anzeigen
          </Button>
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-scroll py-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-x-visible">
        {items.map((item, index) => (
          <div
            key={index}
            className="w-full shrink-0 snap-mandatory snap-center px-4 lg:block lg:px-0"
          >
            <ArticleCard article={item} />
          </div>
        ))}
      </div>
    </>
  );
}
