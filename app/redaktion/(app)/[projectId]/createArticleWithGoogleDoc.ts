"use server";

import { getGoogleAuthClient } from "@/app/(shared)/GoogleAuthClient";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import {
  CpPaperArticlesFormat,
  CpPaperArticlesStatus,
  CpPersonCompetences,
} from "@/util/cockpit.generated";
import {
  createPaperArticle,
  updatePaperArticle,
} from "@/domain/paper/paper-repo";
import { google } from "googleapis";
import {
  GoogleDocPreparationError,
  prepareArticleWithPoolDocument,
} from "./googleDocPreparation";

interface CreateArticleInput {
  projectId: string;
  title: string;
  author: string;
  format: CpPaperArticlesFormat;
}

export async function createArticleWithGoogleDoc(input: CreateArticleInput) {
  const person = await resolveUserFromServer();
  if (!person?.competences.includes(CpPersonCompetences.Editor)) {
    throw new Error("No authorization");
  }

  let articleId: string | undefined;
  try {
    // Parse character limits from format
    const { charMin, charMax } = parseFormatToCharLimits(input.format);

    const auth = await getGoogleAuthClient();
    const docs = google.docs({ version: "v1", auth: auth as any });
    const drive = google.drive({ version: "v3", auth: auth as any });

    const sharedFolderId = "1WQ5QhpZisbNpbdJn-zOAuUF2k3jOxecT";

    const {
      article,
      document: docToUse,
      documentId,
      poolFolderId,
    } = await prepareArticleWithPoolDocument(drive, sharedFolderId, () =>
      createPaperArticle({
        name: input.title,
        projectId: input.projectId,
        status: CpPaperArticlesStatus.Writing,
        author: input.author,
        format: input.format,
        char_min: charMin,
        char_max: charMax,
        gid: "",
      }),
    );
    articleId = article._id;

    // 3. Find or create project folder
    const projectFolderSearch = await drive.files.list({
      q: `name='${input.projectId}' and '${sharedFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    let projectFolderId: string;

    if (
      projectFolderSearch.data.files &&
      projectFolderSearch.data.files.length > 0
    ) {
      // Project folder exists
      projectFolderId = projectFolderSearch.data.files[0].id!;
    } else {
      // Create project folder
      const projectFolder = await drive.files.create({
        requestBody: {
          name: input.projectId,
          mimeType: "application/vnd.google-apps.folder",
          parents: [sharedFolderId],
        },
        supportsAllDrives: true,
        fields: "id",
      });
      projectFolderId = projectFolder.data.id!;
    }

    // 4. Move document from Pool to project folder
    const previousParents = docToUse.parents?.join(",") || poolFolderId;
    await drive.files.update({
      fileId: documentId,
      addParents: projectFolderId,
      removeParents: previousParents,
      supportsAllDrives: true,
    });

    // 5. Rename the document
    await drive.files.update({
      fileId: documentId,
      requestBody: {
        name: `${input.title} - Emmausbote`,
      },
      supportsAllDrives: true,
    });

    // 6. Add header with article info and clickable status link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emmaus.wien";
    const statusUpdateUrl = `${baseUrl}/redaktion/artikel/${article._id}`;

    const headerText = `${input.title}\nAutor: ${input.author}\nZiel: ${charMin}-${charMax} Zeichen\n\nStatus aktualisieren: `;
    const linkText = "Hier klicken";
    const footerText = "\n\n---\n\n";

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          // Insert text
          {
            insertText: {
              location: { index: 1 },
              text: headerText + linkText + footerText,
            },
          },
          // Make the link clickable
          {
            updateTextStyle: {
              range: {
                startIndex: headerText.length + 1,
                endIndex: headerText.length + linkText.length + 1,
              },
              textStyle: {
                link: {
                  url: statusUpdateUrl,
                },
                foregroundColor: {
                  color: {
                    rgbColor: {
                      blue: 0.8,
                      green: 0.33,
                      red: 0.26,
                    },
                  },
                },
                underline: true,
              },
              fields: "link,foregroundColor,underline",
            },
          },
        ],
      },
    });

    // 7. Make document shareable with link (anyone can edit)
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: "writer",
        type: "anyone",
      },
      supportsAllDrives: true,
    });

    // 8. Update article with Google Doc ID
    await updatePaperArticle(article._id, { gid: documentId });

    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    return {
      success: true as const,
      articleId: article._id,
      documentId,
      documentUrl,
      statusUpdateUrl,
    };
  } catch (error) {
    console.error("Error creating article with Google Doc:", {
      articleId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false as const,
      error:
        error instanceof GoogleDocPreparationError
          ? error.message
          : articleId
            ? "Der Beitrag wurde angelegt, aber das Google-Dokument konnte nicht fertig eingerichtet werden. Bitte nicht erneut erstellen, sondern die Administration verständigen."
            : "Der Beitrag konnte nicht erstellt werden. Bitte die Administration verständigen und den Google-Drive-Zugriff prüfen lassen.",
      articleId,
    };
  }
}

function parseFormatToCharLimits(format: CpPaperArticlesFormat): {
  charMin: number;
  charMax: number;
} {
  // Format pattern: C{min}x{max}x{columns}
  // Examples: "C2200x3000x3/4", "C100x2000x~"
  const match = format.match(/C(\d+)x(\d+)/);
  if (match) {
    return {
      charMin: parseInt(match[1], 10),
      charMax: parseInt(match[2], 10),
    };
  }
  // Fallback
  return { charMin: 1000, charMax: 2000 };
}
