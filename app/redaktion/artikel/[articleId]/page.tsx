import { ArticleReadOnlyPage } from "@/app/redaktion/artikel/[articleId]/ArticleReadOnlyPage";
import { GoogleDocArticlePage } from "@/app/redaktion/artikel/[articleId]/GoogleDocArticlePage";
import {
  fetchOnePaperArticle,
  fetchOnePaperProject,
  fetchPaperTexts,
} from "@/domain/paper/paper-repo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ articleId: any }>;
}): Promise<Metadata> {
  const searchParams = await props.params;
  const articleId = searchParams.articleId;
  const article = await fetchOnePaperArticle(articleId);
  return {
    title: `${article?.name ?? "Artikel"} | Emmausbote`,
    description: `Ihr Beitrag für den Emmausboten`,
  };
}

export default async function HomePage(props: {
  params: Promise<{ articleId: any }>;
  searchParams: Promise<{ ansicht?: string }>;
}) {
  const searchParams = await props.params;
  const articleId = searchParams.articleId;
  try {
    const article = await fetchOnePaperArticle(articleId);
    if (!article) {
      notFound();
    }

    const project = await fetchOnePaperProject(article.project._id);
    if (!project) {
      notFound();
    }

    if (article.gid) {
      return (
        <GoogleDocArticlePage
          article={article}
          project={project}
          authorPreview={(await props.searchParams).ansicht === "autor"}
        />
      );
    }

    const versions = await fetchPaperTexts(articleId);
    return (
      <ArticleReadOnlyPage
        article={article}
        project={project}
        version={versions[0]}
      />
    );
  } catch (error) {
    notFound();
  }
}
