import { google } from "googleapis";

export async function getGoogleAuthClient() {
  const service = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64!, "base64").toString(
      "utf8",
    ),
  );
  return new google.auth.GoogleAuth({
    credentials: service,
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ],
  });
}
