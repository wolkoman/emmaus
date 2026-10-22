import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { EmailFooter, EmailImageHeader } from "./components/common";
import * as styles from "./styles";

/**
 * Monatsmitteilungen newsletter — the mail version of a published issue
 * (app/monatsblatt). Same structure and styles as weekly-newsletter.tsx.
 *
 * The mail carries the CONTENT, not links to the PDFs: sections are prepared
 * by the sender (editor/mail/monatsmitteilungen.ts) from the issue's tiles, in
 * the same order the printed flyer reads, minus the parts that only work on
 * paper (see app/monatsblatt/content.ts).
 */

interface CalendarEvent {
  date: string;
  time: string | null;
  summary: string;
  description?: string;
}

const monthlyArticleTitle = {
  ...styles.articleTitle,
  fontSize: "18px",
  lineHeight: "22px",
};

interface MonthlyNewsletterProps {
  /** Issue name, e.g. "September 2026". */
  title: string;
  /** Editorial cover line of the issue, if any. */
  coverText?: string;
  /** Ready-to-render sections; `body` is sanitized HTML. */
  sections: Array<{ title?: string; body: string }>;
  events: CalendarEvent[];
  /** Editorial deadline of the next issue, already formatted. */
  deadline?: string;
  contactMail: string;
}

export const MonthlyNewsletter = ({
  title = "Monatsmitteilungen",
  coverText,
  sections = [],
  events = [],
  deadline,
  contactMail = "monatsblatt@emmaus.wien",
}: MonthlyNewsletterProps) => {
  const groupedEvents = events.reduce(
    (acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    },
    {} as Record<string, CalendarEvent[]>,
  );
  const eventDates = Object.keys(groupedEvents);

  return (
    <Html>
      <Head />
      <Preview>Monatsblatt {title} - Pfarre Emmaus am Wienerberg</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* The issue's cover line is the headline of the mail, exactly as it
            is the headline of the printed cover. */}
          <EmailImageHeader
            title={coverText || "Monatsmitteilungen"}
            subtitle={`Monatsblatt ${title}`}
          />

          <Section style={styles.contentSection}>
            <Text style={styles.greeting}>Liebe Gemeindemitglieder,</Text>
            <Text style={styles.paragraph}>
              mit diesen Monatsmitteilungen möchten wir Sie über Neuigkeiten und
              Veranstaltungen in unserer Pfarre im {title} informieren. Eine
              stets aktuelle Übersicht aller Termine finden Sie auch unter{" "}
              <Link href="https://emmaus.wien/termine" style={styles.link}>
                emmaus.wien/termine
              </Link>
              . Das gedruckte Monatsblatt liegt außerdem in der Kirche für Sie
              bereit.
            </Text>

            {sections.map((section, index) => (
              <Section key={index}>
                <Hr style={styles.divider} />
                <Section style={styles.articleSection}>
                  {section.title && (
                    <Heading as="h2" style={monthlyArticleTitle}>
                      {section.title}
                    </Heading>
                  )}
                  <div
                    style={styles.articleBody}
                    dangerouslySetInnerHTML={{ __html: section.body }}
                  />
                </Section>
              </Section>
            ))}

            {events.length > 0 && (
              <Section>
                <Hr style={styles.divider} />
                <Section style={styles.articleSection}>
                  <Heading as="h2" style={monthlyArticleTitle}>
                    Termine
                  </Heading>
                  <table style={styles.eventsTable}>
                    <tbody>
                      {eventDates.map((date) => (
                        <React.Fragment key={date}>
                          {groupedEvents[date].map((event, eventIndex) => (
                            <tr key={`${date}-${eventIndex}`}>
                              <td style={styles.eventDateCell}>
                                {eventIndex === 0 ? date : ""}
                              </td>
                              <td style={styles.eventTimeCell}>
                                {event.time || ""}
                              </td>
                              <td style={styles.eventInfoCell}>
                                <div style={styles.eventSummary}>
                                  {event.summary}
                                </div>
                                {event.description && (
                                  <div style={styles.eventDescriptionCell}>
                                    {event.description}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </Section>
              </Section>
            )}

            <Hr style={styles.divider} />

            <Text style={styles.paragraph}>
              {deadline ? (
                <>
                  Ihre Beiträge für die nächste Ausgabe senden Sie bitte bis{" "}
                  {deadline} an{" "}
                </>
              ) : (
                <>Ihre Beiträge für die nächste Ausgabe senden Sie bitte an </>
              )}
              <Link href={`mailto:${contactMail}`} style={styles.link}>
                {contactMail}
              </Link>
            </Text>

            <Text style={styles.paragraph}>
              Gottes Segen und einen guten Monat,
              <br />
              <strong>das Pfarrteam</strong>
            </Text>
          </Section>
        </Container>

        <EmailFooter containerWidth="680px" />
      </Body>
    </Html>
  );
};

MonthlyNewsletter.PreviewProps = {
  title: "September 2026",
  coverText: "Willkommen zurück aus der Sommerpause!",
  sections: [
    {
      title: "Erntedankfest",
      body: "<p>Wir laden Sie herzlich zur Festmesse zum Erntedankfest am 4. Oktober um 10:00 Uhr ein.</p>",
    },
    {
      title: "Evangelien des Monats",
      body: "<p>So 06.09. — Mt 18, 15-20</p>",
    },
  ],
  events: [
    {
      date: "So., 06.09.",
      time: "10:00",
      summary: "Hl. Messe",
    },
    {
      date: "Di., 08.09.",
      time: "19:00",
      summary: "Bibelrunde",
      description: "Im Pfarrsaal",
    },
  ],
  deadline: "Sonntag, 20. September",
  contactMail: "monatsblatt@emmaus.wien",
} satisfies MonthlyNewsletterProps;

export default MonthlyNewsletter;
