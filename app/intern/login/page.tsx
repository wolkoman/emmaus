import { PageHeading } from "@/components/intern/AppUI";
import { InternShell } from "@/components/intern/InternLayout";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginPage } from "./LoginPage";

export const metadata: Metadata = {
  title: "Login | Emmaus",
};

export default function Events() {
  return (
    <InternShell
      footer={
        <>
          Probleme beim Anmelden? Schreiben Sie an{" "}
          <Link
            className="text-emmaus underline-offset-2 hover:underline"
            href="mailto:admin@emmaus.wien"
          >
            admin@emmaus.wien
          </Link>{" "}
          oder melden Sie sich bei Manuel.
        </>
      }
    >
      <main className="flex grow items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <PageHeading
            title="Anmelden"
            description="Zu Ihren Diensten, zur Redaktion und zu den Ressourcen der Pfarre."
          />
          <Suspense fallback={"lädt..."}>
            <LoginPage />
          </Suspense>
        </div>
      </main>
    </InternShell>
  );
}
