"use server";

import { mailOptions, transporter } from "@/app/(shared)/mail/sendMail";
import { Links } from "@/app/(shared)/Links";
import { signToken } from "@/domain/jsonwebtoken";
import { MIN_PASSWORD_LENGTH } from "@/domain/users/password-policy";
import {
  closeResets,
  createReset,
  fetchPersonById,
  findOpenReset,
  findPersonsByLogin,
  hasRecentReset,
} from "@/domain/users/security-repo";
import { sessionPerson } from "@/domain/users/session";
import { doubleHash } from "@/domain/users/UserResolver";
import PasswordReset from "@/emails/password-reset";
import { pb } from "@/util/pocketbase";
import { render } from "@react-email/components";
import crypto from "crypto";

const RESET_VALIDITY_MS = 60 * 60 * 1000;
const RESEND_PAUSE_MS = 2 * 60 * 1000;

const sha256 = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

/**
 * Mails a reset link to every active person matching the username or email.
 * Always resolves the same way, so the form doesn't reveal who has an account.
 */
export async function requestPasswordReset(identifier: string): Promise<void> {
  const persons = await findPersonsByLogin(identifier);
  for (const person of persons) {
    if (!person.email || !person.username) continue;
    if (await hasRecentReset(person.id, new Date(Date.now() - RESEND_PAUSE_MS)))
      continue;

    const token = crypto.randomBytes(32).toString("base64url");
    await createReset(
      person.id,
      sha256(token),
      new Date(Date.now() + RESET_VALIDITY_MS),
    );

    // From config, never from the request: a forged Host header must not end up in the mail.
    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://emmaus.wien";
    const resetUrl = `${base}${Links.PasswortZuruecksetzen}?token=${token}`;
    const props = { name: person.name, username: person.username, resetUrl };
    await transporter.sendMail({
      ...mailOptions,
      to: `${person.name} <${person.email}>`,
      subject: "Passwort zurücksetzen - Pfarre Emmaus",
      html: await render(PasswordReset(props)),
      text: await render(PasswordReset(props), { plainText: true }),
    });
  }
}

/** Sets the new password and returns a login token, or null for an invalid or expired link. */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<string | null> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) return null;
  const reset = await findOpenReset(sha256(token));
  if (!reset) return null;
  const person = await fetchPersonById(reset.person);
  if (!person?.active) return null;

  const client = await pb();
  await client
    .collection("persons")
    .update(person.id, { code: doubleHash(newPassword) });
  await closeResets(person.id);

  return signToken(await sessionPerson(person));
}
