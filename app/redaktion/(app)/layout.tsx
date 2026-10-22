import { RedaktionShell } from "@/app/redaktion/RedaktionShell";
import { AppLoading } from "@/components/intern/AppShell";
import { ReactNode, Suspense } from "react";

// Shared by the project pages, so the sidebar stays mounted while switching
// projects. Articles (../artikel) are opened by authors and live outside.
export default function RedaktionLayout(props: { children: ReactNode }) {
  return (
    <Suspense fallback={<AppLoading title="Redaktion" />}>
      <RedaktionShell>{props.children}</RedaktionShell>
    </Suspense>
  );
}
