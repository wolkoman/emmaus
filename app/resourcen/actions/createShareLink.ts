"use server";

import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { createSharedLink } from "@/domain/forms/forms-repo";

export async function createShareLink(
  folderId: string,
  photoIds: string[],
): Promise<{ shareId: string; shareUrl: string }> {
  const person = await resolveUserFromServer();
  if (!person) {
    throw new Error("No authorization");
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);

  const result = await createSharedLink({
    folder: folderId,
    expiration: expirationDate.toISOString(),
    ids: photoIds.map((id) => ({ value: id })),
  });

  if (!result?._id) {
    throw new Error("Failed to create share link");
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emmaus.wien";
  return {
    shareId: result._id,
    shareUrl: `${baseUrl}/resourcen/shared/${result._id}`,
  };
}
