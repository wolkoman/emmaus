import { CpPerson, CpPersonCompetences } from "@/util/cockpit.generated";

export interface Mailbox {
  slug: string;
  title: string;
  address: string;
  competence: CpPersonCompetences;
  /** Name of the env var with the mailbox password (World4you IMAP/SMTP). */
  passwordEnv: string;
}

export const MAILBOXES: Mailbox[] = [
  {
    slug: "events",
    title: "Events",
    address: "events@emmaus.wien",
    competence: CpPersonCompetences.MailEvents,
    passwordEnv: "EVENTS_MAIL_PASSWORD",
  },
];

export function canReadMailbox(person: CpPerson, mailbox: Mailbox) {
  return !!person.admin || person.competences.includes(mailbox.competence);
}

export function mailboxesFor(person: CpPerson) {
  return MAILBOXES.filter((mailbox) => canReadMailbox(person, mailbox));
}

/** URL segment → IMAP folder (World4you names). */
export const MAIL_FOLDERS = {
  posteingang: { title: "Posteingang", path: "INBOX" },
  gesendet: { title: "Gesendet", path: "Sent" },
} as const;

export type MailFolder = keyof typeof MAIL_FOLDERS;

export function isMailFolder(value: string): value is MailFolder {
  return value in MAIL_FOLDERS;
}
