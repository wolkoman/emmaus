import type {
  CpNewsletter,
  CpSharedLinks,
  CpSharedLinksIds,
} from "@/util/cockpit.generated";
import type {
  NewsletterResponse,
  SharedLinksResponse,
} from "@/pb/pocketbase-types";
import { pb } from "@/util/pocketbase";

/**
 * Pocketbase data access for the form-driven collections (newsletter,
 * shared_links, alpha_registrations). PB-only — these slices are fully cut
 * over; rollback is reverting the commit.
 *
 * Returned objects keep the Cockpit-era shapes (`Cp*`, `_id`, `{value}[]`
 * wrappers) so consumers are unchanged. `_id` exposes the original Cockpit
 * id when the row was migrated (important for shared_links, whose public
 * URLs embed it); lookups by id accept either.
 */

function isNotFound(err: unknown): boolean {
  return (
    !!err && typeof err === "object" && "status" in err && err.status === 404
  );
}

const exposedId = (r: { id: string; cockpit_id: string }) =>
  r.cockpit_id || r.id;

// ---- newsletter ----

function toCpNewsletter(n: NewsletterResponse): CpNewsletter {
  return {
    __collectionName: "newsletter",
    _id: exposedId(n),
    _created: 0,
    _modified: 0,
    mail: n.mail,
    token: n.token,
    active: n.active,
  };
}

export async function fetchNewsletterRecipients(): Promise<CpNewsletter[]> {
  const client = await pb();
  const rows = await client.collection("newsletter").getFullList();
  return rows.map(toCpNewsletter);
}

export async function fetchOneNewsletter(filter: {
  mail?: string;
  token?: string;
}): Promise<CpNewsletter | undefined> {
  const client = await pb();
  const key = filter.mail !== undefined ? "mail" : "token";
  const value = filter.mail ?? filter.token ?? "";
  try {
    const rec = await client
      .collection("newsletter")
      .getFirstListItem(client.filter(`${key} = {:value}`, { value }));
    return toCpNewsletter(rec);
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

export async function createNewsletterSubscription(data: {
  mail: string;
  token: string;
  active: boolean;
}): Promise<void> {
  const client = await pb();
  await client.collection("newsletter").create(data);
}

export async function activateNewsletterSubscription(
  id: string,
): Promise<void> {
  const client = await pb();
  const rec = await client
    .collection("newsletter")
    .getFirstListItem(
      client.filter("cockpit_id = {:id} || id = {:id}", { id }),
    );
  await client.collection("newsletter").update(rec.id, { active: true });
}

// ---- shared_links ----

function toCpSharedLink(s: SharedLinksResponse): CpSharedLinks {
  return {
    __collectionName: "shared_links",
    _id: exposedId(s),
    _created: 0,
    _modified: 0,
    expiration: s.expiration,
    folder: s.folder,
    ids: (Array.isArray(s.ids) ? s.ids : []) as CpSharedLinksIds[],
  };
}

export async function createSharedLink(data: {
  folder: string;
  expiration: string;
  ids: { value: string }[];
}): Promise<CpSharedLinks> {
  const client = await pb();
  const rec = await client.collection("shared_links").create(data);
  return toCpSharedLink(rec as SharedLinksResponse);
}

export async function fetchOneSharedLink(
  id: string,
): Promise<CpSharedLinks | undefined> {
  const client = await pb();
  try {
    const rec = await client
      .collection("shared_links")
      .getFirstListItem(
        client.filter("cockpit_id = {:id} || id = {:id}", { id }),
      );
    return toCpSharedLink(rec);
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

// ---- alpha_registrations ----

export async function createAlphaRegistration(data: {
  name: string;
  phone: string;
  mail: string;
  postal: string;
}): Promise<{ _id: string }> {
  const client = await pb();
  const rec = await client.collection("alpha_registrations").create(data);
  return { _id: rec.id };
}
