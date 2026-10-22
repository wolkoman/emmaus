"use server";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { CpPersonCompetences } from "@/util/cockpit.generated";
import {
  fetchOnePaperProject,
  fetchPaperArticles,
} from "@/domain/paper/paper-repo";

export async function fetchArticles(projectId: string) {
  const person = await resolveUserFromServer();

  if (!person?.competences.includes(CpPersonCompetences.Editor)) {
    throw new Error("No authorization");
  }

  return {
    articles: await fetchPaperArticles(projectId),
    name: await fetchOnePaperProject(projectId).then((x) => x?.name ?? ""),
  };
}
