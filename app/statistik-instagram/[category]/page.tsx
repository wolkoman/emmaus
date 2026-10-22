import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InternPage } from "@/components/intern/InternLayout";
import Responsive from "@/components/Responsive";
import {
  categoryById,
  categoryBuckets,
  fmtNum,
  fmtPct,
  getPostsForCategory,
  loadPosts,
  loadTaxonomy,
  postsByReach,
} from "../data";
import { PostCard } from "../PostCard";

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const taxonomy = loadTaxonomy();
  return taxonomy.categories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryById(category);
  if (!cat) {
    return { title: "Kategorie nicht gefunden" };
  }
  return {
    title: `${cat.name} | Instagram Statistik`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const cat = categoryById(category);
  if (!cat) notFound();

  const allPosts = loadPosts();
  const buckets = categoryBuckets(allPosts);
  const stats = buckets.find((b) => b.id === category);
  if (!stats) notFound();

  const categoryPosts = getPostsForCategory(category);
  const sortedByReach = postsByReach(categoryPosts, "desc");

  return (
    <InternPage title={cat.name}>
      <Responsive>
        <div className="pb-20">
          <Link
            href="/statistik-instagram"
            className="mb-6 inline-flex items-center gap-1 text-sm text-[#3A7276] hover:underline"
          >
            ← Zurück zur Übersicht
          </Link>

          <p className="mb-8 text-stone-700">{cat.description}</p>

          <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-6">
            <Kpi label="Posts" value={fmtNum(stats.posts.length)} />
            <Kpi label="Med. Reach" value={fmtNum(stats.medianReach)} />
            <Kpi label="Med. Views" value={fmtNum(stats.medianViews)} />
            <Kpi label="Med. ER" value={fmtPct(stats.medianEngagementRate)} />
            <Kpi label="Med. Saves" value={fmtNum(stats.medianSaves)} />
            <Kpi
              label="Neue Follower"
              value={`+${fmtNum(stats.totalNewFollowers)}`}
              highlight
            />
          </div>

          {stats.posts.filter((p) => p.postType === "IG reel").length > 0 && (
            <div className="mb-10 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
              <strong>Format-Mix (nur Reels):</strong>{" "}
              {fmtPct(stats.staticReelsPct)} Static ·{" "}
              {fmtPct(stats.videoReelsPct)} echtes Video
            </div>
          )}

          <h2 className="mb-4 text-xl font-bold text-stone-900">
            Alle Posts in dieser Kategorie ({categoryPosts.length})
          </h2>
          <p className="mb-6 text-sm text-stone-600">
            Sortiert nach Reach absteigend.
          </p>

          <div className="flex flex-col gap-2">
            {sortedByReach.map((p) => (
              <PostCard key={p.postId} post={p} />
            ))}
          </div>
        </div>
      </Responsive>
    </InternPage>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${highlight ? "border-[#3A7276]/30 bg-[#3A7276]/5" : "border-stone-200 bg-white"}`}
    >
      <div className="text-xs tracking-wide text-stone-500 uppercase">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-bold ${highlight ? "text-[#3A7276]" : "text-stone-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
