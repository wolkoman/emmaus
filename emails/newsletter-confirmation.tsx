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

interface NewsletterConfirmationProps {
  confirmUrl: string;
}

export const NewsletterConfirmation = ({
  confirmUrl = "https://emmaus.wien/newsletter/bestaetigen?token=example",
}: NewsletterConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Body style={{ ...styles.main, margin: "20px 0" }}>
        <Container style={styles.container}>
          <EmailLogoHeader />
          <Section style={styles.contentSection}>
            <Text style={styles.h2}>Newsletter-Anmeldung bestätigen</Text>

            <Text style={styles.paragraph}>
              Vielen Dank für Ihr Interesse an unserem Newsletter!
            </Text>

            <Text style={styles.paragraph}>
              Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den
              folgenden Button klicken:
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
                href={confirmUrl}
              >
                Newsletter abonnieren
              </Button>
            </Section>

            <Text
              style={{
                ...styles.paragraph,
                color: "#666666",
                fontSize: "14px",
              }}
            >
              Wenn Sie sich nicht für unseren Newsletter angemeldet haben,
              können Sie diese E-Mail ignorieren.
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
                href={confirmUrl}
                style={{ ...styles.link, fontSize: "12px" }}
              >
                {confirmUrl}
              </Link>
            </Text>
          </Section>
        </Container>

        <EmailFooter containerWidth="600px" />
      </Body>
    </Html>
  );
};

export default NewsletterConfirmation;
