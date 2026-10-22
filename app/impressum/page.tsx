import React from "react";
import Site from "@/components/Site";
import { SanitizeHTML } from "@/components/SanitizeHtml";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { fetchImpressum } from "@/app/(domain)/content/content-repo";

export default async function HomePage() {
  "use cache";
  cacheLife("max");
  const impressum = await fetchImpressum();
  return (
    <Site title="Impressum" showTitle>
      <SanitizeHTML html={impressum.content} />
    </Site>
  );
}
