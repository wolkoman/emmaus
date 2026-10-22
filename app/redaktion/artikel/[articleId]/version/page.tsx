"use server";

import { EditorVersionPage } from "./EditorVersionPage";
import { fetchPaperTexts } from "@/domain/paper/paper-repo";
import { InternPage } from "@/components/intern/InternLayout";

export default async function HomePage(props: {
  params: Promise<{ articleId: any }>;
}) {
  const { articleId } = await props.params;
  const versions = await fetchPaperTexts(articleId);
  return (
    <InternPage title="Versionen">
      <div className="flex flex-col gap-2">
        <EditorVersionPage versions={versions} />
      </div>
    </InternPage>
  );
}
