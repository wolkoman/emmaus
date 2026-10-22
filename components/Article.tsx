import Site from "./Site";
import React, { ReactNode } from "react";
import Link from "next/link";
import { formatDate } from "@/app/(shared)/Localization";
import { ArticleCard } from "@/app/ArticleCard";

type SuggestedArticle = React.ComponentProps<typeof ArticleCard>["article"];

export const Article = (props: {
  image: string;
  title: string;
  created: number;
  author?: string;
  suggestedArticles?: SuggestedArticle[];
  children: ReactNode;
}) => {
  return (
    <Site responsive={false} title={props.title}>
      <article className="relative">
        {props.image && (
          <div
            className="absolute inset-x-0 top-0 -z-10 h-96 bg-cover bg-center opacity-15 blur-3xl"
            style={{ backgroundImage: `url(${props.image})` }}
          ></div>
        )}

        <header className="mx-auto w-full max-w-3xl px-4 pt-8 lg:pt-16">
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance lg:text-5xl">
            {props.title}
          </h1>
          <div className="mt-4 flex items-center gap-1">
            {props.author && <span>{props.author}, </span>}
            <time>
              {formatDate(props.created ?? 0, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
        </header>

        {props.image && (
          <div className="mx-auto mt-8 w-full max-w-4xl lg:px-4">
            <img
              className="aspect-video w-full object-cover shadow-md lg:rounded-xl"
              src={props.image}
              alt={props.title}
            />
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16">
          {props.children}
        </div>

        {props.suggestedArticles && props.suggestedArticles.length > 0 && (
          <aside className="mx-auto w-full max-w-5xl px-4 pb-16">
            <div className="grid gap-8 lg:grid-cols-3">
              {props.suggestedArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </aside>
        )}
      </article>
    </Site>
  );
};
