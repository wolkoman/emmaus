import {
    Body,
    Container,
    Head,
    Html,
    Section,
    Text,
} from "@react-email/components";
import { EmailFooter, EmailLogoHeader } from "./components/common";
import * as styles from "./styles";

interface AlphaRegistrationNotificationProps {
  name: string;
  phone: string;
  mail: string;
  postal: string;
}

export const AlphaRegistrationNotification = ({
  name = "Max Mustermann",
  phone = "+43 123 456789",
  mail = "max@example.com",
  postal = "1100",
}: AlphaRegistrationNotificationProps) => {
  return (
    <Html>
      <Head />
      <Body style={{ ...styles.main, margin: "20px 0" }}>
        <Container style={styles.container}>
          <EmailLogoHeader />
          <Section style={styles.contentSection}>
            <Text style={styles.h2}>Neue Alpha-Kurs Anmeldung</Text>

            <Text style={styles.paragraph}>
              Es gibt eine neue Anmeldung für den Alpha-Kurs:
            </Text>

            <Section
              style={{
                ...styles.eventSection,
                marginTop: "20px",
                marginBottom: "20px",
              }}
            >
              <Text style={{ ...styles.paragraph, margin: "8px 0" }}>
                <strong>Name:</strong> {name}
              </Text>

              <Text style={{ ...styles.paragraph, margin: "8px 0" }}>
                <strong>Telefonnummer:</strong> {phone}
              </Text>

              <Text style={{ ...styles.paragraph, margin: "8px 0" }}>
                <strong>E-Mail:</strong>{" "}
                <a href={`mailto:${mail}`} style={styles.link}>
                  {mail}
                </a>
              </Text>

              <Text style={{ ...styles.paragraph, margin: "8px 0" }}>
                <strong>Postleitzahl:</strong> {postal}
              </Text>
            </Section>

            <Text style={styles.paragraph}>
              Bitte kontaktieren Sie die Person, um weitere Details zum
              Alpha-Kurs zu besprechen.
            </Text>

            <Text style={styles.paragraph}>
              Mit freundlichen Grüßen
              <br />
              Pfarre Emmaus am Wienerberg Anmeldesystem
            </Text>
          </Section>
        </Container>

        <EmailFooter containerWidth="600px" />
      </Body>
    </Html>
  );
};

export default AlphaRegistrationNotification;
