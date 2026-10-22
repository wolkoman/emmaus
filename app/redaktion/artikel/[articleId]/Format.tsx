import { CpPaperArticles } from "@/util/cockpit.generated";

export function extractArticleLength(articles: CpPaperArticles) {
  const ts = articles?.format?.split("x");
  if (ts && ts.length === 3) {
    return [+ts[0].substring(1), +ts[1]];
  } else {
    return [+articles.char_min, +articles.char_max];
  }
}

export function describeArticleLength(articles: CpPaperArticles) {
  const ts = articles?.format?.split("x");
  if (ts && ts.length === 3) {
    return ts[2] + " Seite" + (ts[2][0] == "1" ? "" : "n");
  } else {
    return articles.char_min + "-" + articles.char_max;
  }
}
