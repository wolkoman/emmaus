import { Links } from "@/app/(shared)/Links";
import { getFolders } from "@/app/(shared)/ResourceAPI";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { AppSidebarSegmentLink } from "@/components/intern/AppSidebarSegmentLink";
import { AppShell } from "@/components/intern/AppShell";
import {
  AppSidebarLayout,
  AppSidebarSection,
} from "@/components/intern/AppSidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { PiFolder, PiPalette, PiUploadSimple } from "react-icons/pi";

/**
 * Resourcen as a two-pane app: brand kit and photo folders in the sidebar,
 * the chosen one on the right. Rendered by the (app) layout, so it persists
 * while navigating between folders.
 */
export async function ResourcenShell(props: { children: ReactNode }) {
  const person = await resolveUserFromServer();
  return (
    <AppShell
      title="Resourcen"
      // The brand kit is public; visitors come from the website.
      backHref={person ? Links.Intern : Links.Hauptseite}
      actions={
        person && (
          <Link href="/upload">
            <Button variant="outline">
              <PiUploadSimple /> Hochladen
            </Button>
          </Link>
        )
      }
    >
      <AppSidebarLayout
        sidebar={
          <>
            <AppSidebarSection>
              <AppSidebarSegmentLink
                href={Links.Resourcen}
                segment={null}
                icon={<PiPalette />}
              >
                Marke & Vorlagen
              </AppSidebarSegmentLink>
            </AppSidebarSection>
            <AppSidebarSection title="Ordner">
              {person ? (
                <Suspense
                  fallback={
                    <div className="mx-2 h-24 animate-pulse rounded-md bg-black/5" />
                  }
                >
                  <FolderLinks />
                </Suspense>
              ) : (
                <SignInHint />
              )}
            </AppSidebarSection>
          </>
        }
      >
        {props.children}
      </AppSidebarLayout>
    </AppShell>
  );
}

async function FolderLinks() {
  const folders = await sortedFolders();
  return folders.map((folder) => (
    <AppSidebarSegmentLink
      key={folder.id}
      href={`${Links.Resourcen}/${folder.id}`}
      segment={folder.id}
      icon={<PiFolder />}
    >
      {folder.name}
    </AppSidebarSegmentLink>
  ));
}

async function sortedFolders() {
  return (await getFolders()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function SignInHint() {
  return (
    <p className="px-2 text-sm text-black/60">
      Für die Fotoordner bitte{" "}
      <Link
        href={Links.LoginRedirect(Links.Resourcen)}
        className="text-emmaus underline-offset-2 hover:underline"
      >
        anmelden
      </Link>
      .
    </p>
  );
}
