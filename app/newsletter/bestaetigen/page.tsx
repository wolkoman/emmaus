import { Links } from "@/app/(shared)/Links";
import Site from "@/components/Site";
import { Button } from "@/components/ui/button";
import {
  activateNewsletterSubscription,
  fetchOneNewsletter,
} from "@/domain/forms/forms-repo";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Suspense } from "react";

type ConfirmationResult =
  | { success: true; email: string }
  | { success: false; title: string; message: string };

async function confirmSubscription(token: string): Promise<ConfirmationResult> {
  try {
    if (!token) {
      return {
        success: false,
        title: "Ungültiger Link",
        message: "Der Bestätigungslink ist ungültig.",
      };
    }

    const newsletter = await fetchOneNewsletter({ token });

    if (!newsletter) {
      return {
        success: false,
        title: "Link abgelaufen",
        message:
          "Der Bestätigungslink ist abgelaufen oder wurde bereits verwendet.",
      };
    }

    if (newsletter.active) {
      return {
        success: false,
        title: "Bereits angemeldet",
        message:
          "Diese E-Mail-Adresse ist bereits für den Newsletter angemeldet.",
      };
    }

    await activateNewsletterSubscription(newsletter._id);

    return { success: true, email: newsletter.mail };
  } catch (error) {
    console.error("Newsletter confirmation error:", error);
    return {
      success: false,
      title: "Fehler",
      message:
        "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    };
  }
}

async function ConfirmationContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token
    ? await confirmSubscription(token)
    : {
        success: false as const,
        title: "Ungültiger Link",
        message: "Der Bestätigungslink ist ungültig.",
      };

  return (
    <div className={`flex h-full grow items-start justify-center py-32`}>
      <div className="flex items-center gap-6">
        <div className="flex h-[100px] w-[100px] items-center justify-center">
          {result.success ? (
            <CheckCircledIcon className="h-[100px] w-[100px] text-green-500" />
          ) : (
            <CrossCircledIcon className="h-[100px] w-[100px] text-red-500" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-lg font-semibold">
            {result.success
              ? "Newsletter erfolgreich abonniert!"
              : result.title}
          </div>
          <div className="mb-2 text-sm text-neutral-600">
            {result.success ? (
              <>
                Sie erhalten ab sofort die Monatsmitteilungen an{" "}
                <span className="text-emmaus font-medium">{result.email}</span>
              </>
            ) : (
              result.message
            )}
          </div>
          <Link
            href={Links.Monatsblatt}
            className="-mx-4 -my-2 underline opacity-60 hover:no-underline"
          >
            <Button variant="ghost">Zum Monatsblatt</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Site title="Newsletter-Anmeldung" footer={false} navbar={false}>
      <Suspense
        fallback={
          <div className="flex h-full grow items-center justify-center">
            Lädt...
          </div>
        }
      >
        <ConfirmationContent searchParams={searchParams} />
      </Suspense>
    </Site>
  );
}
