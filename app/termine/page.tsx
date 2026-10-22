import { Suspense } from "react";
import { EventPage } from "@/app/termine/EventPage";
import Site from "@/components/Site";
import { Loading } from "@/components/Loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termine | Emmaus",
  description: "Alle Termine unserer Pfarre im Überblick",
};

export default async function TerminPage() {
  return (
    <Site showTitle={true} title={`Termine`}>
      <Suspense
        fallback={
          <div className="grid place-items-center">
            <Loading />
          </div>
        }
      >
        <EventPage />
      </Suspense>
    </Site>
  );
}
