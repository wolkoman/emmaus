import { Heading, Hr, Img, Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { colors } from "../styles";

export const EmailLogoHeader = () => {
  return (
    <Section style={logoSection}>
      <Img
        src="https://emmaus.wien/logotext.png"
        alt="Pfarre Emmaus am Wienerberg"
        style={logo}
      />
    </Section>
  );
};

interface EmailImageHeaderProps {
  title: string;
  subtitle: string;
  headerImage?: string;
}

export const EmailImageHeader = ({
  title,
  subtitle,
  headerImage,
}: EmailImageHeaderProps) => {
  return (
    <>
      <EmailLogoHeader />

      <Section style={headerImage ? header : headerNoImage}>
        <table style={headerTable}>
          <tbody>
            <tr>
              <td style={headerContent}>
                <Heading style={headerTitle}>{title}</Heading>
                <Text style={headerSubtitle}>{subtitle}</Text>
              </td>
              {headerImage && (
                <td style={headerImageContainer}>
                  <Img style={headerImageStyle} src={headerImage} alt={title} />
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </Section>
    </>
  );
};

interface EmailFooterProps {
  containerWidth?: string;
}

export const EmailFooter = ({ containerWidth = "680px" }: EmailFooterProps) => {
  return (
    <Section style={{ ...footer, width: containerWidth }}>
      <Link href="https://emmaus.wien" style={footerLink}>
        Website besuchen
      </Link>
      <Link href="https://emmaus.wien/kontakt" style={footerLink}>
        Kontakt
      </Link>

      <Hr style={footerDivider} />

      <Img
        width={60}
        height={60}
        src="https://emmaus.wien/logo.png"
        alt="Pfarre Emmaus"
        style={footerLogo}
      />
      <Text style={footerAddress}>
        <strong>Röm.-kath. Pfarre Emmaus am Wienerberg</strong>
        <br />
        Dies ist eine automatische Nachricht.
      </Text>
    </Section>
  );
};

const footer = {
  maxWidth: "100%",
  margin: "32px auto 0 auto",
  padding: "0 30px",
};

const footerLink = {
  display: "inline-block",
  color: colors.textLight,
  textDecoration: "underline",
  fontSize: "12px",
  marginRight: "10px",
  marginBottom: "0",
  marginTop: "8px",
};

const footerDivider = {
  margin: "30px 0",
  borderColor: colors.borderMedium,
};

const footerLogo = {
  margin: "0 0 16px 0",
};

const footerAddress = {
  margin: "4px 0",
  fontSize: "12px",
  lineHeight: "15px",
  color: colors.textLight,
};

// Header styles
const logoSection = {
  display: "flex",
  background: colors.backgroundLight,
  padding: "20px 30px",
  justifyContent: "start",
};

const logo = {
  maxWidth: "200px",
  display: "block",
};

const header = {
  borderRadius: "5px 5px 0 0",
  backgroundColor: colors.primary,
  padding: "0 0 0 30px",
};

const headerNoImage = {
  borderRadius: "5px 5px 0 0",
  backgroundColor: colors.primary,
  padding: "30px 30px",
};

const headerTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const headerContent = {
  verticalAlign: "middle" as const,
  paddingRight: "20px",
};

const headerImageContainer = {
  verticalAlign: "middle" as const,
  textAlign: "right" as const,
  width: "200px",
  padding: "0",
};

const headerImageStyle = {
  display: "block",
  width: "200px",
  height: "auto",
  marginLeft: "auto",
};

const headerTitle = {
  color: colors.backgroundWhite,
  fontSize: "27px",
  fontWeight: "bold",
  lineHeight: "27px",
  margin: "30px 0 10px 0",
};

const headerSubtitle = {
  color: colors.backgroundWhite,
  fontSize: "17px",
  margin: "0 0 30px 0",
};
