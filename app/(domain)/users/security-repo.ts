import type { PersonsResponse } from "@/pb/pocketbase-types";
import { pb } from "@/util/pocketbase";

/**
 * PB access for password resets and passkeys. Server-only: every call runs
 * as superuser, so callers must check who is asking.
 */

export type PasskeyRecord = {
  id: string;
  person: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string[] | null;
  name: string;
  last_used: string;
  created: string;
};

type ResetRecord = {
  id: string;
  person: string;
  token_hash: string;
  expires: string;
  used: string;
  created: string;
};

function isNotFound(err: unknown): boolean {
  return (
    !!err && typeof err === "object" && "status" in err && err.status === 404
  );
}

/** The person behind a JWT `_id` (Cockpit id for migrated people, else PB id). */
export async function findPersonRecord(
  personId: string,
): Promise<PersonsResponse | undefined> {
  const client = await pb();
  try {
    return await client
      .collection("persons")
      .getFirstListItem<PersonsResponse>(
        client.filter("id = {:id} || cockpit_id = {:id}", { id: personId }),
      );
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

export async function fetchPersonById(
  recordId: string,
): Promise<PersonsResponse | undefined> {
  const client = await pb();
  try {
    return await client.collection("persons").getOne<PersonsResponse>(recordId);
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

/** Active people whose username or email matches; emails are compared case-insensitively. */
export async function findPersonsByLogin(
  identifier: string,
): Promise<PersonsResponse[]> {
  const client = await pb();
  const value = identifier.trim();
  if (!value) return [];
  return client.collection("persons").getFullList<PersonsResponse>({
    filter: client.filter(
      "active = true && (username = {:value} || email:lower = {:email})",
      { value, email: value.toLowerCase() },
    ),
  });
}

// ---------------------------------------------------------------------------
// Password resets
// ---------------------------------------------------------------------------

export async function createReset(
  personRecordId: string,
  tokenHash: string,
  expires: Date,
) {
  const client = await pb();
  await client.collection("password_resets").create({
    person: personRecordId,
    token_hash: tokenHash,
    expires: expires.toISOString(),
  });
}

export async function hasRecentReset(personRecordId: string, since: Date) {
  const client = await pb();
  const list = await client.collection("password_resets").getList(1, 1, {
    filter: client.filter("person = {:person} && created >= {:since}", {
      person: personRecordId,
      since: since.toISOString().replace("T", " "),
    }),
  });
  return list.totalItems > 0;
}

export async function findOpenReset(
  tokenHash: string,
): Promise<ResetRecord | undefined> {
  const client = await pb();
  try {
    const reset = await client
      .collection("password_resets")
      .getFirstListItem<ResetRecord>(
        client.filter("token_hash = {:hash}", { hash: tokenHash }),
      );
    if (reset.used || new Date(reset.expires) < new Date()) return undefined;
    return reset;
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

/** Invalidates every unused reset link of the person, not just the one used. */
export async function closeResets(personRecordId: string) {
  const client = await pb();
  const open = await client
    .collection("password_resets")
    .getFullList<ResetRecord>({
      filter: client.filter('person = {:person} && used = ""', {
        person: personRecordId,
      }),
    });
  const now = new Date().toISOString();
  await Promise.all(
    open.map((reset) =>
      client.collection("password_resets").update(reset.id, { used: now }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Passkeys
// ---------------------------------------------------------------------------

export async function listPasskeys(
  personRecordId: string,
): Promise<PasskeyRecord[]> {
  const client = await pb();
  return client.collection("passkeys").getFullList<PasskeyRecord>({
    filter: client.filter("person = {:person}", { person: personRecordId }),
    sort: "created",
  });
}

export async function findPasskey(
  credentialId: string,
): Promise<PasskeyRecord | undefined> {
  const client = await pb();
  try {
    return await client
      .collection("passkeys")
      .getFirstListItem<PasskeyRecord>(
        client.filter("credential_id = {:id}", { id: credentialId }),
      );
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

export async function createPasskey(
  data: Omit<PasskeyRecord, "id" | "created" | "last_used">,
) {
  const client = await pb();
  await client.collection("passkeys").create(data);
}

export async function touchPasskey(id: string, counter: number) {
  const client = await pb();
  await client
    .collection("passkeys")
    .update(id, { counter, last_used: new Date().toISOString() });
}

export async function deletePasskey(id: string) {
  const client = await pb();
  await client.collection("passkeys").delete(id);
}
