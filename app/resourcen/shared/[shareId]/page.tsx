import {
  FileInfo,
  Folder,
  getFiles,
  getFolders,
} from "@/app/(shared)/ResourceAPI";
import { GalleryView } from "@/app/resourcen/components/GalleryView";
import { Links } from "@/app/(shared)/Links";
import { AppShell } from "@/components/intern/AppShell";
import { fetchOneSharedLink } from "@/domain/forms/forms-repo";
import { notFound } from "next/navigation";

export default async function SharedResourcePage(props: {
  params: Promise<{ shareId: string }>;
}) {
  const { folder, files, expiration } = await getSharedFolderAndFiles(props);
  const folderPromise = Promise.resolve(folder);
  const filesPromise = Promise.resolve(files);

  return (
    // Opened by people without an account: no sidebar, logo leads home.
    <AppShell title="Geteilte Fotos" backHref={Links.Hauptseite}>
      <GalleryView
        folderPromise={folderPromise}
        filesPromise={filesPromise}
        showInfo={true}
        expiration={expiration}
      />
    </AppShell>
  );
}

async function getSharedFolderAndFiles(props: {
  params: Promise<{ shareId: string }>;
}): Promise<{ folder: Folder; files: FileInfo[]; expiration: string }> {
  const { shareId } = await props.params;

  const sharedLink = await fetchOneSharedLink(shareId);

  if (!sharedLink) {
    notFound();
  }

  const expirationDate = new Date(sharedLink.expiration);
  const now = new Date();
  if (now > expirationDate) {
    notFound();
  }

  const folders = await getFolders();
  const folder = folders.find((folder) => folder.id === sharedLink.folder);
  if (!folder) {
    notFound();
  }

  const allFiles = await getFiles(folder.id);
  const sharedPhotoIds = new Set(
    sharedLink.ids.map((idObj) => idObj.value as string),
  );
  const sharedFiles = allFiles.filter((file) =>
    sharedPhotoIds.has(file.filename),
  );

  return {
    folder,
    files: sharedFiles,
    expiration: sharedLink.expiration,
  };
}
