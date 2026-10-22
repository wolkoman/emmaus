import { CpPaperArticlesStatus as Status } from "@/util/cockpit.generated";
import {
  fetchPaperArticles,
  fetchPaperProjects,
  upsertPaperStats,
} from "@/domain/paper/paper-repo";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projects = await fetchPaperProjects();
    const mostRecentProject = projects[0];
    if (!mostRecentProject) {
      return new NextResponse("No projects found", { status: 404 });
    }

    const articles = await fetchPaperArticles(mostRecentProject._id);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];

    const count = (s: Status) =>
      articles.filter((a) => (a.status || Status.Writing) === s).length;
    const writingCount = count(Status.Writing);
    const writtenCount = count(Status.Written);
    const correctedCount = count(Status.Corrected);
    const finishedCount = count(Status.Finished);

    const stats = {
      writing: writingCount + writtenCount + correctedCount + finishedCount,
      written: writtenCount + correctedCount + finishedCount,
      corrected: correctedCount + finishedCount,
      finished: finishedCount,
    };

    await upsertPaperStats({
      ...stats,
      projectId: mostRecentProject._id,
      day: yesterdayDate,
    });

    return NextResponse.json({
      message: "Stats recorded successfully",
      project: mostRecentProject.name,
      date: yesterdayDate,
      stats,
    });
  } catch (error) {
    console.error("Error recording stats:", error);
    return new NextResponse("Error recording stats", { status: 500 });
  }
}
