import { getGoogleAuthClient } from "@/app/(shared)/GoogleAuthClient";
import { google } from "googleapis";

/**
 * Fetches the character count from a Google Doc.
 *
 * The create flow inserts an info header followed by a `---` separator line.
 * Only the text the author writes below that separator should be counted, so
 * the header and separator are excluded.
 *
 * @param documentId - The Google Doc ID
 * @returns The character count, or 0 if there's an error
 */
export async function getGoogleDocsCharCount(
  documentId: string,
): Promise<number> {
  try {
    const auth = await getGoogleAuthClient();
    const docs = google.docs({ version: "v1", auth: auth as any });

    const doc = await docs.documents.get({
      documentId,
    });

    // Build the text of each paragraph so we can locate the header separator.
    const paragraphs =
      doc.data.body?.content?.map((element) => {
        if (element.paragraph) {
          return (
            element.paragraph.elements
              ?.map((e) => e.textRun?.content || "")
              .join("") || ""
          );
        }
        return "";
      }) || [];

    // Find the `---` separator inserted by the create flow. Everything up to
    // and including it is header content and must not be counted.
    const separatorIndex = paragraphs.findIndex(
      (paragraph) => paragraph.trim() === "---",
    );

    const contentParagraphs =
      separatorIndex === -1 ? paragraphs : paragraphs.slice(separatorIndex + 1);

    return contentParagraphs.join("").length;
  } catch (error) {
    console.error("Error fetching character count:", error);
    return 0;
  }
}
