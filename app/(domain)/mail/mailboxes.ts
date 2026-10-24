import { CpPerson, CpPersonCompetences } from "@/util/cockpit.generated";

export interface Mailbox {
  slug: string;
  title: string;
  address: string;
  competence: CpPersonCompetences;
  /** Name of the env var with the mailbox password (World4you IMAP/SMTP). */
  passwordEnv: string;
  /** Free-text list kept up to date from received mails. */
  list?: {
    title: string;
    /** Until someone edits them on the list page. */
    defaultInstructions: string;
  };
}

export const MAILBOXES: Mailbox[] = [
  {
    slug: "events",
    title: "Events",
    address: "events@emmaus.wien",
    competence: CpPersonCompetences.MailEvents,
    passwordEnv: "EVENTS_MAIL_PASSWORD",
    list: {
      title: "Anmeldungen",
      defaultInstructions:
        "Anmeldeliste. Eine Zeile pro Anmeldung: Name, Anzahl Personen. " +
        "Besonderheiten (Kinder mit Alter, Essenswünsche, Zustieg, offene " +
        "Fragen) in Klammern dahinter. Abmeldungen streichen, Änderungen " +
        "in der bestehenden Zeile nachtragen.",
    },
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
