import { AppLoading } from "@/components/intern/AppShell";
import { ResourcenShell } from "@/app/resourcen/ResourcenShell";
import { ReactNode, Suspense } from "react";

// Shared by /resourcen and /resourcen/[folderId], so the sidebar stays mounted
// while switching folders. Share links (../shared) live outside this group.
export default function ResourcenLayout(props: { children: ReactNode }) {
  return (
    <Suspense fallback={<AppLoading title="Resourcen" />}>
      <ResourcenShell>{props.children}</ResourcenShell>
    </Suspense>
  );
}
