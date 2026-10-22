import { SanitizeHTML } from "@/components/SanitizeHtml";
import React from "react";
import "./../styles/history.scss";

// Renders HTML content migrated from Cockpit (sites, articles). The eni→
// emmaus host rewrite is kept as a safety net for any stray legacy links in
// the stored HTML.
export function RenderCpWysiwyg(props: { content: string }) {
  return (
    <div className="prose prose-h2:mb-4 prose-h2:mt-10 prose-h3:mb-1 prose-h3:mt-2 prose-p:my-1 prose-p:text-lg prose-p:leading-[1.7] prose-li:my-1 prose-li:text-lg prose-li:leading-[1.7] prose-li:marker:text-emmaus w-full max-w-none">
      <SanitizeHTML
        html={props.content.replaceAll("data.eni.wien", "data.emmaus.wien")}
      />
    </div>
  );
}
