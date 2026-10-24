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
import { MAIL_FOLDERS, Mailbox, mailboxesFor } from "@/domain/mail/mailboxes";
import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import {
  PiBell,
  PiListChecks,
  PiPaperPlaneTilt,
  PiPencilSimple,
  PiTray,
} from "react-icons/pi";

export const metadata: Metadata = {
  title: "Postfach | Emmaus",
};

const FOLDER_ICONS = {
  posteingang: <PiTray />,
  gesendet: <PiPaperPlaneTilt />,
};

function sidebarEntries(mailbox: Mailbox) {
  return [
    ...Object.entries(MAIL_FOLDERS).map(([folder, { title }]) => ({
      segment: folder,
      href: Links.PostfachOrdner(mailbox.slug, folder),
      title,
      icon: FOLDER_ICONS[folder as keyof typeof FOLDER_ICONS],
    })),
    ...(mailbox.list
      ? [
          {
            segment: "liste",
            href: Links.PostfachListe(mailbox.slug),
            title: mailbox.list.title,
            icon: <PiListChecks />,
          },
        ]
      : []),
    {
      segment: "benachrichtigung",
      href: Links.PostfachBenachrichtigung(mailbox.slug),
      title: "Benachrichtigung",
      icon: <PiBell />,
    },
  ];
}

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
            {sidebarEntries(mailbox).map((entry) =>
              mailbox.slug === current ? (
                <AppSidebarSegmentLink key={entry.segment} {...entry}>
                  {entry.title}
                </AppSidebarSegmentLink>
              ) : (
                <AppSidebarLink key={entry.segment} {...entry}>
                  {entry.title}
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
