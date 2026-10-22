import { resolveCompetencesForGroup } from "@/domain/users/PermissionResolver";
import { pbPersonToCp } from "@/domain/users/persons-repo";
import type { PersonsResponse } from "@/pb/pocketbase-types";
import { CpPerson } from "@/util/cockpit.generated";
import { pb } from "@/util/pocketbase";

/**
 * The person a login token is issued for, whichever way they signed in
 * (password, PB admin password, passkey, reset link).
 *
 * Admin is not a separate account: a person whose email belongs to a PB
 * superuser gets admin rights on top of their own competences.
 */
export async function sessionPerson(
  record: PersonsResponse,
): Promise<CpPerson> {
  const person = pbPersonToCp(record);
  const admin = await isSuperuserEmail(record.email);
  return {
    ...person,
    code: "user",
    admin,
    competences: admin
      ? [
          ...new Set([
            ...person.competences,
            ...resolveCompetencesForGroup("admin"),
          ]),
        ]
      : person.competences,
  };
}

async function isSuperuserEmail(email: string | undefined) {
  if (!email) return false;
  const client = await pb();
  const matches = await client.collection("_superusers").getList(1, 1, {
    filter: client.filter("email = {:email}", { email: email.toLowerCase() }),
  });
  return matches.totalItems > 0;
}

/** The active person a PB admin account belongs to, matched by email. */
export async function personForSuperuser(
  email: string,
): Promise<PersonsResponse | undefined> {
  // The server's own PB account is for the backend only, never a website login.
  if (email.toLowerCase() === process.env.PB_ADMIN_EMAIL?.toLowerCase())
    return undefined;
  const client = await pb();
  const persons = await client
    .collection("persons")
    .getFullList<PersonsResponse>({
      filter: client.filter("active = true && email:lower = {:email}", {
        email: email.toLowerCase(),
      }),
    });
  return persons.length === 1 ? persons[0] : undefined;
}
