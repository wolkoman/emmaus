import { LiturgyOverview } from "./LiturgyOverview";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Liturgische Dienste | Emmaus",
};

type SearchParams = Promise<{ ansicht?: string }>;

async function Overview({ searchParams }: { searchParams: SearchParams }) {
  const { ansicht } = await searchParams;
  return (
    <LiturgyOverview
      initialView={
        ansicht === "meine" ? "mine" : ansicht === "plan" ? "plan" : undefined
      }
    />
  );
}

export default function HomePage(props: { searchParams: SearchParams }) {
  return (
    <TooltipProvider>
      {/* searchParams are request data, which Cache Components only allow inside Suspense. */}
      <Suspense>
        <Overview searchParams={props.searchParams} />
      </Suspense>
    </TooltipProvider>
  );
}
