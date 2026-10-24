import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Section,
  Text,
} from "@react-email/components";
import { EmailFooter, EmailLogoHeader } from "./components/common";
import * as styles from "./styles";

interface MailDigestProps {
  address: string;
  url: string;
  mails: { subject: string; from: string; date: string }[];
}

export const MailDigest = ({
  address = "events@emmaus.wien",
  url = "https://emmaus.wien/postfach/events/posteingang",
  mails = [
    { subject: "Anmeldung Adventmarkt", from: "Maria Huber", date: "24.10." },
  ],
}: MailDigestProps) => {
  return (
    <Html>
      <Head />
      <Body style={{ ...styles.main, margin: "20px 0" }}>
        <Container style={styles.container}>
          <EmailLogoHeader />
          <Section style={styles.contentSection}>
            <Text style={styles.h2}>
              {mails.length === 1
                ? `1 E-Mail an ${address} wartet auf Antwort`
                : `${mails.length} E-Mails an ${address} warten auf Antwort`}
            </Text>

            <Section style={{ ...styles.eventSection, margin: "20px 0" }}>
              {mails.map((mail, index) => (
                <Text
                  key={index}
                  style={{ ...styles.paragraph, margin: "8px 0" }}
                >
                  <strong>{mail.subject}</strong>
                  <br />
                  {mail.from}, {mail.date}
                </Text>
              ))}
            </Section>

            <Section style={styles.buttonSection}>
              <Button href={url} style={styles.button}>
                Zum Postfach
              </Button>
            </Section>

            <Text style={styles.paragraph}>
              Sie bekommen diese Übersicht jeden Morgen, solange E-Mails offen
              sind. Abmelden können Sie sich im Postfach unter
              „Benachrichtigung“ oder mit einer Antwort auf diese E-Mail.
            </Text>
          </Section>
        </Container>

        <EmailFooter containerWidth="600px" />
      </Body>
    </Html>
  );
};

export default MailDigest;
