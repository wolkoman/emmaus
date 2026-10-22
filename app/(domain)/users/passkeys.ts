"use server";

import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { signToken, verifyToken } from "@/domain/jsonwebtoken";
import {
  createPasskey,
  deletePasskey,
  fetchPersonById,
  findPasskey,
  findPersonRecord,
  listPasskeys,
  touchPasskey,
} from "@/domain/users/security-repo";
import { sessionPerson } from "@/domain/users/session";
import {
  type AuthenticationResponseJSON,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { cookies, headers } from "next/headers";

const CHALLENGE_COOKIE = "WEBAUTHN_CHALLENGE";
const RP_NAME = "Pfarre Emmaus am Wienerberg";

/** Passkeys are bound to a domain, so only our own hosts are accepted. */
const RELYING_PARTIES: Record<string, { rpID: string; origins: string[] }> = {
  "emmaus.wien": {
    rpID: "emmaus.wien",
    origins: ["https://emmaus.wien", "https://www.emmaus.wien"],
  },
  "www.emmaus.wien": {
    rpID: "emmaus.wien",
    origins: ["https://emmaus.wien", "https://www.emmaus.wien"],
  },
  localhost: {
    rpID: "localhost",
    origins: [
      "http://localhost:3000",
      "http://localhost:3100",
      "http://localhost:3200",
    ],
  },
};

async function relyingParty() {
  const host = (await headers()).get("host")?.split(":")[0] ?? "";
  const rp = RELYING_PARTIES[host];
  if (!rp) throw new Error("Passkeys sind auf dieser Adresse nicht verfügbar.");
  return rp;
}

async function storeChallenge(challenge: string, personRecordId?: string) {
  const token = await signToken({ challenge, personRecordId }, "5m");
  (await cookies()).set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 300,
  });
}

/** One-time: the cookie is deleted however the verification ends. */
async function takeChallenge() {
  const store = await cookies();
  const token = store.get(CHALLENGE_COOKIE)?.value;
  store.delete(CHALLENGE_COOKIE);
  if (!token) throw new Error("Die Anfrage ist abgelaufen.");
  const payload = await verifyToken(token);
  return payload as { challenge: string; personRecordId?: string };
}

async function currentPersonRecord() {
  const user = await resolveUserFromServer();
  if (!user || user.code !== "user") throw new Error("Unauthenticated");
  const person = await findPersonRecord(user._id);
  if (!person) throw new Error("Unauthenticated");
  return person;
}

export type PasskeyInfo = {
  id: string;
  name: string;
  created: string;
  lastUsed: string;
};

export async function getMyPasskeys(): Promise<PasskeyInfo[]> {
  const person = await currentPersonRecord();
  return (await listPasskeys(person.id)).map((passkey) => ({
    id: passkey.id,
    name: passkey.name,
    // Day only: formatDate takes "YYYY-MM-DD", PB returns "YYYY-MM-DD hh:mm:ss.sssZ".
    created: passkey.created.slice(0, 10),
    lastUsed: passkey.last_used.slice(0, 10),
  }));
}

export async function startPasskeyRegistration() {
  const person = await currentPersonRecord();
  const rp = await relyingParty();
  const existing = await listPasskeys(person.id);
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rp.rpID,
    userName: person.username || person.name,
    userDisplayName: person.name,
    userID: isoBase64URL.toBuffer(isoBase64URL.fromUTF8String(person.id)),
    attestationType: "none",
    excludeCredentials: existing.map((passkey) => ({
      id: passkey.credential_id,
      transports: passkey.transports ?? undefined,
    })),
    // Discoverable, so the login works without typing a username.
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });
  await storeChallenge(options.challenge, person.id);
  return options;
}

export async function finishPasskeyRegistration(
  response: RegistrationResponseJSON,
  name: string,
): Promise<void> {
  const person = await currentPersonRecord();
  const rp = await relyingParty();
  const { challenge, personRecordId } = await takeChallenge();
  if (personRecordId !== person.id) throw new Error("Unauthenticated");

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: rp.origins,
    expectedRPID: rp.rpID,
  });
  if (!verification.verified) throw new Error("Passkey nicht bestätigt.");

  const { credential } = verification.registrationInfo;
  await createPasskey({
    person: person.id,
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? null,
    name: name.trim().slice(0, 100) || "Passkey",
  });
}

export async function removePasskey(id: string): Promise<void> {
  const person = await currentPersonRecord();
  const own = await listPasskeys(person.id);
  if (!own.some((passkey) => passkey.id === id)) throw new Error("Not found");
  await deletePasskey(id);
}

export async function startPasskeyLogin() {
  const rp = await relyingParty();
  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    userVerification: "preferred",
  });
  await storeChallenge(options.challenge);
  return options;
}

/** Returns a login token, or null when the passkey is unknown or invalid. */
export async function finishPasskeyLogin(
  response: AuthenticationResponseJSON,
): Promise<string | null> {
  const rp = await relyingParty();
  const { challenge } = await takeChallenge();
  const passkey = await findPasskey(response.id);
  if (!passkey) return null;

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: rp.origins,
    expectedRPID: rp.rpID,
    credential: {
      id: passkey.credential_id,
      publicKey: isoBase64URL.toBuffer(passkey.public_key),
      counter: passkey.counter,
      transports: passkey.transports ?? undefined,
    },
  }).catch(() => ({ verified: false as const }));
  if (!verification.verified) return null;

  const person = await fetchPersonById(passkey.person);
  if (!person?.active) return null;
  await touchPasskey(passkey.id, verification.authenticationInfo.newCounter);
  return signToken(await sessionPerson(person));
}
