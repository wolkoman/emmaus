import Link from "next/link";
import * as React from "react";
import { SanitizeHTML } from "@/components/SanitizeHtml";
import RelativeTime from "./RelativeTime";

export function ArticleCard(props: {
  article: {
    title: string;
    image: string;
    date: number;
    slug: string;
    caption: string;
    impuls?: boolean;
  };
}) {
  return (
    <Link
      href={props.article.slug}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[9/6] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={
            !props.article
              ? {}
              : {
                  backgroundImage: props.article.image
                    ? `url(${props.article.image})`
                    : "",
                }
          }
        ></div>
      </div>
      <div className="flex grow flex-col items-start justify-center gap-2 p-5">
        <div className="group-hover:text-emmaus line-clamp-2 text-lg font-semibold transition-colors">
          {props.article.title}
        </div>
        <SanitizeHTML
          textOnly
          html={props.article.caption}
          className="line-clamp-5 max-w-full opacity-90"
        />
        <div className="text-sm text-gray-500">
          <RelativeTime date={new Date(props.article.date * 1000)} />
        </div>
      </div>
    </Link>
  );
}
