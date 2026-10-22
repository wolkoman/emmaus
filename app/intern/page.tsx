import { Links } from "@/app/(shared)/Links";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { Loading } from "@/components/Loading";
import { AppHeaderLink } from "@/components/intern/AppShell";
import { APP_CARD_LINK, PageHeading } from "@/components/intern/AppUI";
import { InternPage } from "@/components/intern/InternLayout";
import { cn } from "@/util/utils";
import { internAreas } from "@/components/nav/intern-areas";
import { DynamicPiIcon } from "@/components/nav/NavigationItem";
import { CpPerson } from "@/util/cockpit.generated";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PiArrowRight, PiGlobe, PiHandWaving } from "react-icons/pi";

export const metadata: Metadata = {
  title: "Mein Bereich | Emmaus",
};

export default function MeinBereichPage() {
  return (
    <InternPage
      title="Mein Bereich"
      backHref={Links.Hauptseite}
      actions={
        <>
          <AppHeaderLink href={Links.Hauptseite} icon={<PiGlobe />}>
            Zur Website
          </AppHeaderLink>
          <AppHeaderLink href={Links.Logout} icon={<PiHandWaving />}>
            Abmelden
          </AppHeaderLink>
        </>
      }
    >
      <Suspense fallback={<Loading />}>
        <InternHome />
      </Suspense>
    </InternPage>
  );
}

async function InternHome() {
  const person = await resolveUserFromServer();
  if (!person) redirect(Links.LoginRedirect(Links.Intern));

  const name = firstName(person);
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title={`Grüß Gott${name ? `, ${name}` : ""}!`}
        description="Schön, dass Sie da sind. Wohin möchten Sie heute?"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {internAreas(person).map((area) => (
          <Link
            key={area.href}
            href={area.href}
            className={cn(
              APP_CARD_LINK,
              "group focus-visible:ring-emmaus flex items-start gap-4 p-5 focus-visible:ring-2 focus-visible:outline-none",
            )}
          >
            <div className="bg-emmaus/10 text-emmaus grid size-11 shrink-0 place-items-center rounded-full">
              <DynamicPiIcon name={area.icon} className="text-2xl" />
            </div>
            <div className="flex grow flex-col">
              <div className="flex items-center justify-between gap-2 font-semibold">
                {area.title}
                <PiArrowRight className="text-emmaus opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="text-sm text-gray-600">{area.slogan}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Admins log in with their email, which isn't a name worth greeting. */
function firstName(person: CpPerson): string | undefined {
  if (!person.name || person.name.includes("@")) return undefined;
  return person.name.trim().split(/\s+/)[0];
}
