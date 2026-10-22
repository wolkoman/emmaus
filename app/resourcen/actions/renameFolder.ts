"use server";

import { renameFolder as apiRenameFolder } from "@/app/(shared)/ResourceAPI";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { revalidatePath } from "next/cache";

export async function renameFolder(
  folderId: string,
  name: string,
  credit?: string,
): Promise<void> {
  const person = await resolveUserFromServer();
  if (!person) {
    throw new Error("No authorization");
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Ordnername darf nicht leer sein.");
  }

  await apiRenameFolder(folderId, trimmedName, credit?.trim());

  revalidatePath("/resourcen");
  revalidatePath(`/resourcen/${folderId}`);
}
