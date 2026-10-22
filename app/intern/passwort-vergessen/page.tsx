import { PageHeading } from "@/components/intern/AppUI";
import { InternShell } from "@/components/intern/InternLayout";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Passwort vergessen | Emmaus",
};

export default function ForgotPasswordPage() {
  return (
    <InternShell>
      <main className="flex grow items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <PageHeading
            title="Passwort vergessen"
            description="Wir schicken Ihnen einen Link, mit dem Sie ein neues Passwort festlegen."
          />
          <ForgotPasswordForm />
        </div>
      </main>
    </InternShell>
  );
}
