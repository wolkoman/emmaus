"use server";

import { doubleHash } from "@/domain/users/UserResolver";
import { getUser } from "@/domain/users/get-user";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { MIN_PASSWORD_LENGTH } from "@/domain/users/password-policy";
import { personsRepo } from "@/domain/users/persons-repo";

export async function changePasswordOnServer(
  oldPassword: string,
  newPassword: string,
) {
  if (newPassword.length < MIN_PASSWORD_LENGTH) throw new Error();
  const userFromRequest = await resolveUserFromServer();
  if (userFromRequest === undefined) throw new Error();

  const userFromServer = await getUser(userFromRequest.username, oldPassword);
  if (userFromServer === undefined) throw new Error();

  await personsRepo().savePersonCode(
    userFromRequest._id,
    doubleHash(newPassword),
  );
}
