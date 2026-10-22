import {
  CpPerson,
  CpPersonCompetences,
  fetchOneCpPerson,
  saveCpPerson,
} from "@/util/cockpit.generated";
import type { PersonsResponse } from "@/pb/pocketbase-types";
import { pb } from "@/util/pocketbase";

/**
 * Data access for persons/auth.
 *
 * Backend is a hardcoded const (no env var): flip PERSONS_BACKEND back to
 * "cockpit" and redeploy to roll back. Admins sign in as their person; see
 * session.ts.
 */
export const PERSONS_BACKEND: "pb" | "cockpit" = "pb";

export interface PersonsRepo {
  fetchPersonByUsername(username: string): Promise<CpPerson | undefined>;
  /** Update a person's login code (double-hashed password). */
  savePersonCode(personId: string, code: string): Promise<void>;
}

export function personsRepo(): PersonsRepo {
  return PERSONS_BACKEND === "pb" ? pbPersonsRepo : cockpitPersonsRepo;
}

export function pbPersonToCp(p: PersonsResponse): CpPerson {
  return {
    __collectionName: "person",
    _id: p.cockpit_id || p.id,
    _created: 0,
    _modified: 0,
    name: p.name,
    email: p.email,
    username: p.username,
    competences: Array.isArray(p.competences)
      ? (p.competences as CpPersonCompetences[])
      : [],
    code: p.code,
    active: p.active,
    last_login: p.last_login,
    whatsapp_id: "",
    liturgyRemindersDisabled: p.liturgy_reminders_disabled,
  };
}

const pbPersonsRepo: PersonsRepo = {
  async fetchPersonByUsername(username) {
    const client = await pb();
    try {
      const rec = await client
        .collection("persons")
        .getFirstListItem(
          client.filter("username = {:username}", { username }),
        );
      return pbPersonToCp(rec as PersonsResponse);
    } catch (err) {
      if (isNotFound(err)) return undefined;
      throw err;
    }
  },

  async savePersonCode(personId, code) {
    const client = await pb();
    const rec = await client
      .collection("persons")
      .getFirstListItem(
        client.filter("cockpit_id = {:id} || id = {:id}", { id: personId }),
      );
    await client.collection("persons").update(rec.id, { code });
  },
};

const cockpitPersonsRepo: PersonsRepo = {
  async fetchPersonByUsername(username) {
    return await fetchOneCpPerson({ username });
  },
  async savePersonCode(personId, code) {
    await saveCpPerson({ _id: personId, code });
  },
};

function isNotFound(err: unknown): boolean {
  return (
    !!err && typeof err === "object" && "status" in err && err.status === 404
  );
}
