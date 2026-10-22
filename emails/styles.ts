// Shared email template styles for Pfarre Emmaus

// Color constants
export const colors = {
  // Brand colors
  primary: "#3A7276",

  // Background colors
  backgroundLight: "#f3f3f5",
  backgroundWhite: "#ffffff",
  backgroundGray: "#f9f9f9",

  // Text colors
  textDark: "#0c0d0e",
  textBody: "#3c3f44",
  textMuted: "#6c757d",
  textLight: "#9199a1",

  // Border colors
  borderLight: "#e3e8ee",
  borderMedium: "#d6d8db",
};

// Base styles
export const main = {
  backgroundColor: colors.backgroundLight,
  fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
};

export const container = {
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "600px",
};

// Content sections

export const contentSection = {
  borderRadius: "5px",
  backgroundColor: colors.backgroundWhite,
  padding: "30px",
};

// Typography
export const h1 = {
  color: colors.textDark,
  fontSize: "24px",
  textAlign: "center" as const,
  padding: "20px 0 0 0",
  margin: "0 0 20px 0",
};

export const h2 = {
  margin: "0 0 15px",
  fontWeight: "bold",
  fontSize: "21px",
  lineHeight: "21px",
  color: colors.textDark,
};

export const h3 = {
  color: colors.textDark,
  fontSize: "18px",
  fontWeight: "600",
  marginTop: "0",
  marginBottom: "8px",
};

export const paragraph = {
  color: colors.textBody,
  fontSize: "15px",
  lineHeight: "21px",
  margin: "16px 0",
};

export const greeting = {
  fontSize: "15px",
  lineHeight: "21px",
  color: colors.textDark,
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

// Links
export const link = {
  color: colors.primary,
  textDecoration: "none",
};

// Buttons
export const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

export const button = {
  backgroundColor: colors.primary,
  borderRadius: "5px",
  color: colors.backgroundWhite,
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

// Dividers
export const divider = {
  margin: "30px 0",
  borderColor: colors.borderLight,
};

// Event styles (for liturgy notifications)
export const eventSection = {
  backgroundColor: colors.backgroundGray,
  padding: "16px",
  borderRadius: "5px",
  marginTop: "16px",
  borderLeft: `4px solid ${colors.primary}`,
};

export const eventDate = {
  color: colors.primary,
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

export const eventDescription = {
  color: colors.textMuted,
  fontSize: "13px",
  lineHeight: "18px",
  margin: "8px 0",
};

export const eventInfo = {
  color: colors.textBody,
  fontSize: "15px",
  fontWeight: "500",
  margin: "8px 0",
};

export const readingLink = {
  color: colors.primary,
  fontSize: "13px",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
};

// Article styles (for newsletters)
export const articleSection = {
  marginBottom: "20px",
};

export const articleTitle = {
  margin: "0 0 15px",
  fontWeight: "bold",
  fontSize: "21px",
  lineHeight: "21px",
  color: colors.textDark,
};

export const articleBody = {
  fontSize: "15px",
  lineHeight: "21px",
  color: colors.textBody,
};

// Event table styles (for newsletter calendar)
export const eventsTable = {
  borderCollapse: "collapse" as const,
  marginTop: "15px",
};

export const eventDateCell = {
  fontSize: "15px",
  lineHeight: "21px",
  color: colors.textBody,
  padding: "6px 12px 6px 0",
  verticalAlign: "top" as const,
  whiteSpace: "nowrap" as const,
};

export const eventTimeCell = {
  fontSize: "15px",
  lineHeight: "21px",
  color: colors.textBody,
  padding: "6px 12px",
  verticalAlign: "top" as const,
  whiteSpace: "nowrap" as const,
};

export const eventInfoCell = {
  fontSize: "15px",
  lineHeight: "21px",
  color: colors.textBody,
  padding: "6px 0",
  verticalAlign: "top" as const,
};

export const eventSummary = {
  fontSize: "15px",
  lineHeight: "21px",
  color: colors.textBody,
  marginBottom: "0",
};

export const eventDescriptionCell = {
  fontSize: "13px",
  lineHeight: "18px",
  color: colors.textMuted,
  marginTop: "4px",
};
