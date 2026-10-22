import {
  Body,
  Button,
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

interface LiturgyNotificationProps {
  name: string;
  link: string;
  events: LiturgyEvent[];
}

export const LiturgyNotification = ({
  name = "Vorname Nachname",
  link = "https://emmaus.wien",
  events = [],
}: LiturgyNotificationProps) => {
  return (
    <Html>
      <Head />
      <Body style={{ ...styles.main, margin: "20px 0" }}>
        <Container style={styles.container}>
          <EmailLogoHeader />
          <Section style={styles.contentSection}>
            <Text style={styles.paragraph}>Liebe:r {name}!</Text>

            <Text style={styles.paragraph}>
              Wir freuen uns, Dich über die nächsten Veranstaltungen informieren
              zu dürfen, bei dem Du zum Dienst eingeteilt bist.
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

            <Text style={styles.paragraph}>
              Solltest Du an diesem Termin verhindert sein, würden wir uns
              freuen, wenn du Dich frühzeitig über nachfolgenden Link austrägst,
              damit wir eine Vertretung organisieren können. Über diesen Link
              kann auch die komplette Lektoratsliste mit den entsprechenden
              Bibelstellen abgerufen werden.
            </Text>

            <Section style={styles.buttonSection}>
              <Button href={link} style={styles.button}>
                Einteilung liturgischer Dienste
              </Button>
            </Section>

            <Text style={styles.paragraph}>
              Im Namen unserer Gemeinde möchten wir uns herzlich für Deinen
              engagierten und wertvollen Dienst während unserer Gottesdienste
              danken. Deine Bereitschaft und Dein Einsatz tragen maßgeblich zur
              feierlichen Gestaltung unserer liturgischen Feiern bei.
            </Text>

            <Text style={styles.paragraph}>Beste Grüße!</Text>
          </Section>
        </Container>

        <EmailFooter containerWidth="600px" />
      </Body>
    </Html>
  );
};

LiturgyNotification.PreviewProps = {
  name: "Maria Mustermann",
  link: "https://emmaus.wien/liturgische-dienste",
  events: [
    {
      date: "Sonntag, 26.01.2025, 10:00",
      summary: "Hl. Messe",
      description: "Sonntagsgottesdienst mit der Gemeinde",
      info: "Lektor:in 1. Lesung - Jes 8,23b-9,3",
      link: "https://www.bibleserver.com/EU/Jesaja8%2C23",
    },
    {
      date: "Sonntag, 02.02.2025, 10:00",
      summary: "Hl. Messe - Mariä Lichtmess",
      description: "Festgottesdienst zu Mariä Lichtmess mit Kerzenweihe",
      info: "Lektor:in 2. Lesung - 1 Kor 2,1-5",
      link: "https://www.bibleserver.com/EU/1.Korinther2",
    },
    {
      date: "Sonntag, 09.02.2025, 10:00",
      summary: "Hl. Messe",
      description: "",
      info: "Lektor:in 1. Lesung - Ijob 7,1-7",
      link: "https://www.bibleserver.com/EU/Ijob7",
    },
  ],
} as LiturgyNotificationProps;

export default LiturgyNotification;
