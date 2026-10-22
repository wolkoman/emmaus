import { pb } from "@/util/pocketbase";
import type {
  LiturgiesResponse,
  LiturgyEventsResponse,
  LiturgyRostersResponse,
  PersonsResponse,
} from "@/pb/pocketbase-types";
import {
  CpLiturgy,
  CpLiturgyEvent,
  CpLiturgyEventCancellations,
  CpLiturgyRoster,
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
} from "@/util/cockpit.generated";
import { pbPersonToCp } from "@/domain/users/persons-repo";
import type {
  LiturgyEventSaveData,
  LiturgyRepo,
} from "@/domain/liturgy/liturgy-repo";

/**
 * Pocketbase backend for the liturgy slice.
 *
 * Maps PB records to the Cockpit-era domain shapes so nothing above the repo
 * layer changes. Id compatibility rules:
 *   - Records migrated from Cockpit expose their original id (`cockpit_id`).
 *   - Records created natively in PB expose the PB id.
 *   - Lookups by id accept either (filtered as `cockpit_id = X || id = X`).
 *
 * Field mapping mirrors scripts/migrate-cockpit-to-pb.ts:
 *   liturgyEvent.eventId      <-> liturgy_events.calendar_event_id
 *   liturgyEvent.liturgyName  <-> liturgy_events.liturgy_name
 *   cancellations [{value}]   <-> json string[]
 *   roster.userId/userName    <-> liturgy_rosters.person (relation) /person_name
 *   roster.liturgyEventId     <-> liturgy_rosters.liturgy_event (relation)
 *   CpLiturgy[date][i]        <-> liturgies rows (key=date, position=i)
 */

type RosterExpand = {
  liturgy_event?: LiturgyEventsResponse;
  person?: PersonsResponse;
};

const byEitherId = (id: string) => ({
  filter: `cockpit_id = {:id} || id = {:id}`,
  params: { id },
});

async function findByEitherId<
  C extends "liturgy_events" | "liturgy_rosters" | "persons",
>(collection: C, id: string) {
  const client = await pb();
  const { filter, params } = byEitherId(id);
  try {
    return await client
      .collection(collection)
      .getFirstListItem(client.filter(filter, params));
  } catch (err: unknown) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

function isNotFound(err: unknown): boolean {
  return (
    !!err && typeof err === "object" && "status" in err && err.status === 404
  );
}

// ---- mapping: PB -> Cp ----

function exposedId(record: { id: string; cockpit_id: string }): string {
  return record.cockpit_id || record.id;
}

function toCpLiturgyEvent(e: LiturgyEventsResponse): CpLiturgyEvent {
  const cancellations = Array.isArray(e.cancellations)
    ? (e.cancellations as unknown[])
        .map((c) =>
          typeof c === "string"
            ? c
            : ((c as { value?: string })?.value ?? null),
        )
        .filter((v): v is string => !!v)
        .map((value) => ({ value }) as CpLiturgyEventCancellations)
    : [];
  return {
    __collectionName: "liturgyEvent",
    _id: exposedId(e),
    _created: 0,
    _modified: 0,
    eventId: e.calendar_event_id,
    liturgyName: e.liturgy_name,
    // Cockpit stored dates as "YYYY-MM-DD" and consumers (e.g. formatDate)
    // rely on that; PB returns "YYYY-MM-DD HH:mm:ss.sssZ", so trim it back.
    date: e.date ? e.date.slice(0, 10) : "",
    cancellations,
  };
}

function toCpRoster(r: LiturgyRostersResponse<RosterExpand>): CpLiturgyRoster {
  const event = r.expand?.liturgy_event;
  const person = r.expand?.person;
  return {
    __collectionName: "liturgyRoster",
    _id: exposedId(r),
    _created: 0,
    _modified: 0,
    liturgyEventId: event ? exposedId(event) : r.liturgy_event,
    userId: person ? exposedId(person) : (r.person ?? ""),
    userName: r.person_name,
    position: r.position as CpLiturgyRosterPosition,
    status: r.status as CpLiturgyRosterStatus,
    reminderSent: r.reminder_sent || undefined,
  };
}

// ---- mapping: Cp -> PB payloads ----

function toPbDate(date: string): string {
  // Cockpit uses "YYYY-MM-DD"; PB round-trips full ISO. Accept both.
  return date.includes("T")
    ? new Date(date).toISOString()
    : new Date(`${date}T00:00:00.000Z`).toISOString();
}

function eventPayload(data: LiturgyEventSaveData) {
  const payload: Record<string, unknown> = {};
  if (data.eventId !== undefined) payload.calendar_event_id = data.eventId;
  if (data.liturgyName !== undefined) payload.liturgy_name = data.liturgyName;
  if (data.date !== undefined) payload.date = toPbDate(data.date);
  if (data.cancellations !== undefined)
    payload.cancellations = (data.cancellations ?? [])
      .map((c) => (typeof c === "string" ? c : c?.value))
      .filter((v): v is string => !!v);
  return payload;
}

export const pbLiturgyRepo: LiturgyRepo = {
  async fetchLiturgy(): Promise<CpLiturgy> {
    const client = await pb();
    const rows = await client
      .collection("liturgies")
      .getFullList({ sort: "key,position" });
    const result: CpLiturgy = {};
    for (const row of rows as LiturgiesResponse[]) {
      (result[row.key] ??= []).push({
        name: row.name,
        rank: row.rank,
        color: row.color,
        reading1: row.reading1,
        reading2: row.reading2,
        psalm: row.psalm,
        evangelium: row.evangelium,
      });
    }
    return result;
  },

  async saveLiturgy(data) {
    const client = await pb();
    const existing = (await client
      .collection("liturgies")
      .getFullList()) as LiturgiesResponse[];
    const byKeyPosition = new Map(
      existing.map((row) => [`${row.key}|${row.position}`, row]),
    );

    for (const [date, variants] of Object.entries(data)) {
      const arr = Array.isArray(variants) ? variants : [];
      for (const [position, v] of arr.entries()) {
        const payload = {
          key: date,
          position,
          name: v?.name ?? "",
          rank: v?.rank ?? "",
          color: v?.color ?? "",
          reading1: v?.reading1 ?? "",
          reading2: v?.reading2 ?? "",
          psalm: v?.psalm ?? "",
          evangelium: v?.evangelium ?? "",
        };
        const row = byKeyPosition.get(`${date}|${position}`);
        if (!row) {
          await client.collection("liturgies").create(payload);
        } else if (
          row.name !== payload.name ||
          row.rank !== payload.rank ||
          row.color !== payload.color ||
          row.reading1 !== payload.reading1 ||
          row.reading2 !== payload.reading2 ||
          row.psalm !== payload.psalm ||
          row.evangelium !== payload.evangelium
        ) {
          await client.collection("liturgies").update(row.id, payload);
        }
      }
    }
  },

  async fetchLiturgyEvents() {
    const client = await pb();
    const rows = await client.collection("liturgy_events").getFullList();
    return rows.map(toCpLiturgyEvent);
  },

  async fetchOneLiturgyEvent(filter) {
    if (filter._id) {
      const rec = await findByEitherId("liturgy_events", filter._id);
      return rec ? toCpLiturgyEvent(rec as LiturgyEventsResponse) : undefined;
    }
    const client = await pb();
    try {
      const rec = await client.collection("liturgy_events").getFirstListItem(
        client.filter("calendar_event_id = {:eventId}", {
          eventId: filter.eventId ?? "",
        }),
      );
      return toCpLiturgyEvent(rec);
    } catch (err) {
      if (isNotFound(err)) return undefined;
      throw err;
    }
  },

  async saveLiturgyEvent(data) {
    const client = await pb();
    const existing = data._id
      ? await findByEitherId("liturgy_events", data._id)
      : undefined;
    const payload = eventPayload(data);
    const saved = existing
      ? await client.collection("liturgy_events").update(existing.id, payload)
      : await client.collection("liturgy_events").create(payload);
    return toCpLiturgyEvent(saved as LiturgyEventsResponse);
  },

  async fetchLiturgyRosters() {
    const client = await pb();
    const rows = await client
      .collection("liturgy_rosters")
      .getFullList({ expand: "liturgy_event,person" });
    return rows.map((r) =>
      toCpRoster(r as LiturgyRostersResponse<RosterExpand>),
    );
  },

  async fetchOneLiturgyRoster(filter) {
    const client = await pb();
    const event = await findByEitherId("liturgy_events", filter.liturgyEventId);
    if (!event) return undefined;
    try {
      const rec = await client.collection("liturgy_rosters").getFirstListItem(
        client.filter("liturgy_event = {:event} && position = {:position}", {
          event: event.id,
          position: filter.position,
        }),
        { expand: "liturgy_event,person" },
      );
      return toCpRoster(rec as LiturgyRostersResponse<RosterExpand>);
    } catch (err) {
      if (isNotFound(err)) return undefined;
      throw err;
    }
  },

  async saveLiturgyRoster(data) {
    const client = await pb();
    const existing = data._id
      ? await findByEitherId("liturgy_rosters", data._id)
      : undefined;

    const payload: Record<string, unknown> = {};
    if (data.liturgyEventId !== undefined) {
      const event = await findByEitherId("liturgy_events", data.liturgyEventId);
      if (!event)
        throw new Error(`liturgy_event ${data.liturgyEventId} not found in PB`);
      payload.liturgy_event = event.id;
    }
    if (data.userId !== undefined) {
      const person = data.userId
        ? await findByEitherId("persons", data.userId)
        : undefined;
      if (data.userId && !person)
        throw new Error(`person ${data.userId} not found in PB`);
      payload.person = person?.id ?? "";
    }
    if (data.userName !== undefined) payload.person_name = data.userName;
    if (data.position !== undefined) payload.position = data.position;
    if (data.status !== undefined) payload.status = data.status;
    if (data.reminderSent !== undefined)
      payload.reminder_sent = data.reminderSent;

    const saved = existing
      ? await client
          .collection("liturgy_rosters")
          .update(existing.id, payload, { expand: "liturgy_event,person" })
      : await client
          .collection("liturgy_rosters")
          .create(payload, { expand: "liturgy_event,person" });
    return toCpRoster(saved as LiturgyRostersResponse<RosterExpand>);
  },

  async deleteLiturgyRoster(id) {
    const client = await pb();
    const existing = await findByEitherId("liturgy_rosters", id);
    if (!existing) return;
    await client.collection("liturgy_rosters").delete(existing.id);
  },

  async fetchPersons() {
    const client = await pb();
    const rows = await client.collection("persons").getFullList();
    return rows.map((p) => pbPersonToCp(p as PersonsResponse));
  },

  async fetchOnePerson(filter) {
    const rec = await findByEitherId("persons", filter._id);
    return rec ? pbPersonToCp(rec as PersonsResponse) : undefined;
  },

  async savePersonLiturgyRemindersDisabled(personId, disabled) {
    const rec = await findByEitherId("persons", personId);
    if (!rec) throw new Error(`person ${personId} not found in PB`);
    const client = await pb();
    await client
      .collection("persons")
      .update(rec.id, { liturgy_reminders_disabled: disabled });
  },
};
