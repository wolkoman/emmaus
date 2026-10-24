import { Links } from "@/app/(shared)/Links";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { AppLoading, AppShell } from "@/components/intern/AppShell";
import {
  AppSidebarLayout,
  AppSidebarLink,
  AppSidebarSection,
} from "@/components/intern/AppSidebar";
import { AppSidebarSegmentLink } from "@/components/intern/AppSidebarSegmentLink";
import { Button } from "@/components/ui/button";
import { MAIL_FOLDERS, mailboxesFor } from "@/domain/mail/mailboxes";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { PiPaperPlaneTilt, PiPencilSimple, PiTray } from "react-icons/pi";

export const metadata: Metadata = {
  title: "Postfach | Emmaus",
};

const FOLDER_ICONS = {
  posteingang: <PiTray />,
  gesendet: <PiPaperPlaneTilt />,
};

// Stays mounted while switching between folders and messages of a mailbox.
export default function PostfachLayout(props: {
  params: Promise<{ mailbox: string }>;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<AppLoading title="Postfach" />}>
      <PostfachShell params={props.params}>{props.children}</PostfachShell>
    </Suspense>
  );
}

async function PostfachShell(props: {
  params: Promise<{ mailbox: string }>;
  children: ReactNode;
}) {
  const person = await resolveUserFromServer();
  const { mailbox: current } = await props.params;
  const mailboxes = person ? mailboxesFor(person) : [];

  return (
    <AppShell
      title="Postfach"
      actions={
        mailboxes.some((m) => m.slug === current) && (
          <Link href={Links.PostfachNeu(current)}>
            <Button variant="outline">
              <PiPencilSimple /> Neue E-Mail
            </Button>
          </Link>
        )
      }
    >
      <AppSidebarLayout
        sidebar={mailboxes.map((mailbox) => (
          <AppSidebarSection key={mailbox.slug} title={mailbox.address}>
            {Object.entries(MAIL_FOLDERS).map(([folder, { title }]) =>
              mailbox.slug === current ? (
                <AppSidebarSegmentLink
                  key={folder}
                  href={Links.PostfachOrdner(mailbox.slug, folder)}
                  segment={folder}
                  icon={FOLDER_ICONS[folder as keyof typeof FOLDER_ICONS]}
                >
                  {title}
                </AppSidebarSegmentLink>
              ) : (
                <AppSidebarLink
                  key={folder}
                  href={Links.PostfachOrdner(mailbox.slug, folder)}
                  icon={FOLDER_ICONS[folder as keyof typeof FOLDER_ICONS]}
                >
                  {title}
                </AppSidebarLink>
              ),
            )}
          </AppSidebarSection>
        ))}
      >
        {props.children}
      </AppSidebarLayout>
    </AppShell>
  );
}
