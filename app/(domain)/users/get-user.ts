import { doubleHash } from "@/domain/users/UserResolver";
import { personsRepo } from "@/domain/users/persons-repo";
import { personForSuperuser, sessionPerson } from "@/domain/users/session";
import type { PersonsResponse } from "@/pb/pocketbase-types";
import { CpPerson } from "@/util/cockpit.generated";
import { pb, pbAuthSuperuser } from "@/util/pocketbase";

/**
 * Checks a login and returns the person to issue the token for. Accepts the
 * person's own password or, for admins, their PB admin password; both lead
 * to the same person.
 */
export async function getUser(
  username: string,
  password: string,
): Promise<CpPerson | undefined> {
  const person = await personByUsername(username);
  if (person && (await passwordMatches(person, password)))
    return sessionPerson(person);

  const admin = await pbAuthSuperuser(username, password);
  if (!admin) return undefined;
  const adminPerson = await personForSuperuser(admin.email);
  return adminPerson ? sessionPerson(adminPerson) : undefined;
}

async function personByUsername(
  username: string,
): Promise<PersonsResponse | undefined> {
  if (!username) return undefined;
  const client = await pb();
  const persons = await client
    .collection("persons")
    .getFullList<PersonsResponse>({
      filter: client.filter("active = true && username = {:username}", {
        username,
      }),
    });
  return persons[0];
}

async function passwordMatches(person: PersonsResponse, password: string) {
  if (!person.code) return false;
  const hashed = doubleHash(password ?? "");
  if (person.code === hashed) return true;
  // Legacy codes are stored in plain text; a stored hash must never work as the password itself.
  if (isHash(person.code) || person.code !== password) return false;
  // Upgrade the legacy plain-text code; a failed upgrade must not block the login.
  await personsRepo()
    .savePersonCode(person.id, hashed)
    .catch((err) => console.error("Could not hash legacy login code", err));
  return true;
}

/** Output shape of doubleHash (sha256, base64). */
function isHash(code: string) {
  return /^[A-Za-z0-9+/]{43}=$/.test(code);
}
