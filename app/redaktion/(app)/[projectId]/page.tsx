import { ContentLoading } from "@/components/intern/AppUI";
import { fetchOnePaperProject } from "@/domain/paper/paper-repo";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorProjectPage } from "./EditorProjectPage";

export async function generateMetadata(props: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const projectId = params.projectId;

  const project = await fetchOnePaperProject(projectId);
  return {
    title: `${project?.name || "Projekt"} | Emmaus Redaktion`,
    description: `Redaktionsbereich für das Projekt ${project?.name || ""}`,
  };
}

export default async function ProjectPage(props: {
  params: Promise<{ projectId: string }>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<ContentLoading />}>
      <EditorProjectPage projectId={params.projectId} />
    </Suspense>
  );
}
