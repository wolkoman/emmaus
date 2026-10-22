import { Folder, getFiles, getFolders } from "@/app/(shared)/ResourceAPI";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { GalleryView } from "@/app/resourcen/components/GalleryView";
import { Links } from "@/app/(shared)/Links";
import { redirect } from "next/navigation";

export default async function HomePage(props: {
  params: Promise<{ folderId: string }>;
}) {
  const person = await resolveUserFromServer();
  const { folderId } = await props.params;
  if (!person) {
    redirect(Links.LoginRedirect(`${Links.Resourcen}/${folderId}`));
  }

  const folderPromise = getThisFolder(props);
  const filesPromise = folderPromise.then((folder) => getFiles(folder.id));

  return (
    <GalleryView
      folderPromise={folderPromise}
      filesPromise={filesPromise}
      createShareables={true}
      showInfo={true}
      editable={true}
    />
  );
}

async function getThisFolder(props: {
  params: Promise<{ folderId: string }>;
}): Promise<Folder> {
  const folders = await getFolders();
  const { folderId } = await props.params;
  const folder = folders.find((folder) => folder.id === folderId);
  if (!folder) {
    throw new Error("Folder not found");
  }
  return folder;
}
