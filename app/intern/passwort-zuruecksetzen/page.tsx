import { PageHeading } from "@/components/intern/AppUI";
import { InternShell } from "@/components/intern/InternLayout";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Neues Passwort | Emmaus",
};

export default function ResetPasswordPage() {
  return (
    <InternShell>
      <main className="flex grow items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <PageHeading
            title="Neues Passwort festlegen"
            description="Danach sind Sie gleich angemeldet."
          />
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </InternShell>
  );
}
