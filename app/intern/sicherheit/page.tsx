import { Links } from "@/app/(shared)/Links";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { Loading } from "@/components/Loading";
import { InternPage } from "@/components/intern/InternLayout";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SecuritySections } from "./Security";

export const metadata: Metadata = {
  title: "Sicherheit | Emmaus",
};

export default function SecurityPage() {
  return (
    <InternPage width="sm" title="Sicherheit">
      <Suspense fallback={<Loading />}>
        <Security />
      </Suspense>
    </InternPage>
  );
}

async function Security() {
  const person = await resolveUserFromServer();
  if (!person) redirect(Links.LoginRedirect(Links.Sicherheit));
  return <SecuritySections admin={!!person.admin} />;
}
