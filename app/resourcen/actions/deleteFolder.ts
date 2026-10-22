"use server";

import { deleteFolder as apiDeleteFolder } from "@/app/(shared)/ResourceAPI";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { revalidatePath } from "next/cache";

export async function deleteFolder(folderId: string): Promise<void> {
  const person = await resolveUserFromServer();
  if (!person) {
    throw new Error("No authorization");
  }

  await apiDeleteFolder(folderId);

  revalidatePath("/resourcen");
}
