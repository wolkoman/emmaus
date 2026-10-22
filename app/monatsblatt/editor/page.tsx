import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { Links } from "@/app/(shared)/Links";
import MonthlyPageEditor from "@/app/monatsblatt/editor/MonthlyPageEditor";
import { loadCachedLiturgyData } from "@/domain/liturgy/liturgy-loading";
import Site from "@/components/Site";
import { CpPersonCompetences } from "@/util/cockpit.generated";
import Link from "next/link";
import { Suspense } from "react";

export default async function MonthlyEditorPage() {
  return (
    <Suspense>
      <AuthorizedEditor />
    </Suspense>
  );
}

async function AuthorizedEditor() {
  const person = await resolveUserFromServer();
  if (!person?.competences.includes(CpPersonCompetences.WeeklyEditor)) {
    return (
      <Site title="Monatsblatt Editor" showTitle>
        <div className="my-8 text-center">
          {person ? (
            "Kein Zugriff auf den Monatsblatt Editor."
          ) : (
            <>
              Bitte{" "}
              <Link href={Links.Login} className="underline">
                anmelden
              </Link>
              , um den Monatsblatt Editor zu verwenden.
            </>
          )}
        </div>
      </Site>
    );
  }
  const liturgy = await loadCachedLiturgyData();
  return <MonthlyPageEditor liturgies={liturgy} />;
}
