import Link from "next/link";
import { fmtDate, fmtNum, fmtPct, formatLabel, getThumbUrl, JoinedPost } from "./data";

export function PostCard({
  post,
  categoryName,
  showCategory,
}: {
  post: JoinedPost;
  categoryName?: string;
  showCategory?: boolean;
}) {
  const thumb = getThumbUrl(post);

  return (
    <div className="flex gap-3 rounded-lg border border-stone-200 bg-white p-3 hover:border-stone-300">
      <a
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0"
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={post.description.slice(0, 60)}
            className="size-20 rounded object-cover md:size-24"
            loading="lazy"
          />
        ) : (
          <div className="size-20 rounded bg-stone-100 md:size-24" />
        )}
      </a>
      <div className="min-w-0 flex-grow">
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
          <span>{fmtDate(post.date)}</span>
          <span>·</span>
          <span>{formatLabel(post)}</span>
          {showCategory && post.primaryCategory && (
            <>
              <span>·</span>
              <Link
                href={`/statistik-instagram/${post.primaryCategory}`}
                className="text-[#3A7276] hover:underline"
              >
                {categoryName ?? post.primaryCategory}
              </Link>
            </>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-stone-800">
          {post.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
          <span>
            Reach <strong className="text-stone-900">{fmtNum(post.reach)}</strong>
          </span>
          <span>
            ER <strong className="text-stone-900">{fmtPct(post.engagementRate)}</strong>
          </span>
          <span>
            Likes <strong>{fmtNum(post.likes)}</strong>
          </span>
          <span>
            Saves <strong>{fmtNum(post.saves)}</strong>
          </span>
          <span>
            Kommentare <strong>{fmtNum(post.comments)}</strong>
          </span>
          {post.newFollowers > 0 && (
            <span>
              Neue Follower <strong className="text-[#3A7276]">+{post.newFollowers}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
