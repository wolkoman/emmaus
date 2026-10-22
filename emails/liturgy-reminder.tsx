import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { EmailFooter, EmailLogoHeader } from "./components/common";
import * as styles from "./styles";

interface LiturgyEvent {
  date: string;
  summary: string;
  description: string;
  info: string;
  link: string;
}

interface LiturgyReminderProps {
  name: string;
  settingsLink: string;
  events: LiturgyEvent[];
}

export const LiturgyReminder = ({
  name = "Vorname Nachname",
  settingsLink = "https://emmaus.wien",
  events = [],
}: LiturgyReminderProps) => {
  return (
    <Html>
      <Head />
      <Body style={{ ...styles.main, margin: "20px 0" }}>
        <Container style={styles.container}>
          <EmailLogoHeader />
          <Section style={styles.contentSection}>
            <Text style={styles.paragraph}>Liebe:r {name}!</Text>

            <Text style={styles.paragraph}>
              Wir möchten Dich daran erinnern, dass Du morgen zum Dienst
              eingeteilt bist.
            </Text>

            {events.map((event, index) => (
              <Section key={index} style={styles.eventSection}>
                <Text style={styles.eventDate}>{event.date} Uhr</Text>
                <Heading as="h3" style={styles.h3}>
                  {event.summary}
                </Heading>
                {event.description && (
                  <Text style={styles.eventDescription}>
                    {event.description}
                  </Text>
                )}
                <Text style={styles.eventInfo}>
                  {event.info}: {name}{" "}
                  {event.link && (
                    <Link href={event.link} style={styles.readingLink}>
                      [Link zur Bibelstelle]
                    </Link>
                  )}
                </Text>
              </Section>
            ))}

            <Text style={styles.paragraph}>Vielen Dank für Deinen Dienst!</Text>

            <Text style={styles.paragraph}>Beste Grüße!</Text>

            <Text style={{ ...styles.paragraph, fontSize: "13px" }}>
              Du möchtest diese Erinnerungen nicht mehr erhalten? Unter{" "}
              <Link href={settingsLink} style={styles.readingLink}>
                Meine Dienste
              </Link>{" "}
              kannst Du sie abschalten.
            </Text>
          </Section>
        </Container>

        <EmailFooter containerWidth="600px" />
      </Body>
    </Html>
  );
};

LiturgyReminder.PreviewProps = {
  name: "Maria Mustermann",
  settingsLink: "https://emmaus.wien/liturgische-dienste?ansicht=meine",
  events: [
    {
      date: "Sonntag, 26.01.2025, 10:00",
      summary: "Hl. Messe",
      description: "Sonntagsgottesdienst mit der Gemeinde",
      info: "Lektor:in 1. Lesung - Jes 8,23b-9,3",
      link: "https://www.bibleserver.com/EU/Jesaja8%2C23",
    },
  ],
} as LiturgyReminderProps;

export default LiturgyReminder;
