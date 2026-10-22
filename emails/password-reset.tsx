import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { EmailFooter, EmailLogoHeader } from "./components/common";
import * as styles from "./styles";

interface PasswordResetProps {
  name: string;
  username: string;
  resetUrl: string;
}

export const PasswordReset = ({
  name = "Maria Muster",
  username = "maria",
  resetUrl = "https://emmaus.wien/intern/passwort-zuruecksetzen?token=example",
}: PasswordResetProps) => {
  return (
    <Html>
      <Head />
      <Body style={{ ...styles.main, margin: "20px 0" }}>
        <Container style={styles.container}>
          <EmailLogoHeader />
          <Section style={styles.contentSection}>
            <Text style={styles.h2}>Passwort zurücksetzen</Text>

            <Text style={styles.paragraph}>Hallo {name},</Text>

            <Text style={styles.paragraph}>
              für Ihren Zugang mit dem Benutzernamen <b>{username}</b> wurde ein
              neues Passwort angefordert. Über den folgenden Button können Sie
              es festlegen. Der Link ist eine Stunde gültig.
            </Text>

            <Section style={{ textAlign: "center" as const, margin: "32px 0" }}>
              <Button
                style={{
                  backgroundColor: "#3A7276",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
                href={resetUrl}
              >
                Neues Passwort festlegen
              </Button>
            </Section>

            <Text
              style={{
                ...styles.paragraph,
                color: "#666666",
                fontSize: "14px",
              }}
            >
              Wenn Sie kein neues Passwort angefordert haben, können Sie diese
              E-Mail ignorieren. Ihr Passwort bleibt dann unverändert.
            </Text>

            <Text
              style={{
                ...styles.paragraph,
                marginTop: "32px",
                paddingTop: "16px",
                borderTop: "1px solid #dddddd",
                fontSize: "12px",
                color: "#999999",
              }}
            >
              Alternativ können Sie auch diesen Link kopieren und in Ihren
              Browser einfügen:
              <br />
              <Link
                href={resetUrl}
                style={{ ...styles.link, fontSize: "12px" }}
              >
                {resetUrl}
              </Link>
            </Text>
          </Section>
        </Container>

        <EmailFooter containerWidth="600px" />
      </Body>
    </Html>
  );
};

export default PasswordReset;
