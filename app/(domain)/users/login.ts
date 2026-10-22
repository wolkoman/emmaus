"use server";

import { getUser } from "@/domain/users/get-user";
import { signToken } from "@/domain/jsonwebtoken";

export default async function loginOnServer(
  username: string,
  password: string,
): Promise<string | null> {
  const user = await getUser(username, password);
  if (!user) return null;

  return await signToken(user);
}
