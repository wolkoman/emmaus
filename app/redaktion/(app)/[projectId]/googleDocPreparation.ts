import type { drive_v3 } from "googleapis";

export class GoogleDocPreparationError extends Error {}

export async function prepareArticleWithPoolDocument<T>(
  drive: drive_v3.Drive,
  sharedFolderId: string,
  createArticle: () => Promise<T>,
) {
  const poolSearch = await drive.files.list({
    q: `name='Pool' and '${sharedFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const poolFolderId = poolSearch.data.files?.[0]?.id;
  if (!poolFolderId) {
    throw new GoogleDocPreparationError(
      "Der Google-Drive-Ordner „Pool“ ist für die Website nicht erreichbar. Bitte die Freigabe des Redaktionsordners prüfen. Es wurde kein Beitrag angelegt.",
    );
  }
  const documents = await drive.files.list({
    q: `'${poolFolderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: "files(id, name, parents)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 1,
  });
  const document = documents.data.files?.[0];
  if (!document?.id) {
    throw new GoogleDocPreparationError(
      "Im Google-Drive-Ordner „Pool“ sind keine freien Dokumente vorhanden. Bitte neue leere Google-Dokumente hinzufügen. Es wurde kein Beitrag angelegt.",
    );
  }
  const article = await createArticle();
  return { article, document, documentId: document.id, poolFolderId };
}
