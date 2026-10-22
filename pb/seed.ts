/**
 * Seed fake liturgy data into the local Pocketbase instance.
 *
 * Run: `bun pb:seed`
 *
 * Safe to run multiple times — records are upserted by a stable `cockpit_id`
 * so re-runs don't accumulate duplicates.
 */

import PocketBase from "pocketbase";

const PB_URL = process.env.POCKETBASE_URL ?? "http://localhost:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL ?? "admin@emmaus.local";
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD ?? "devpassword";

async function main() {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);

  console.log(`Authing against ${PB_URL} as ${ADMIN_EMAIL}...`);
  await pb
    .collection("_superusers")
    .authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

  const persons = [
    {
      cockpit_id: "seed-p1",
      name: "Anna Acolyte",
      email: "anna@example.com",
      username: "anna",
      code: "anna-code",
      competences: ["reader", "musician"],
      active: true,
    },
    {
      cockpit_id: "seed-p2",
      name: "Ben Bell-ringer",
      email: "ben@example.com",
      username: "ben",
      code: "ben-code",
      competences: ["sacristan"],
      active: true,
    },
    {
      cockpit_id: "seed-p3",
      name: "Clara Cantor",
      email: "clara@example.com",
      username: "clara",
      code: "clara-code",
      competences: ["musician", "communion_minister"],
      active: true,
    },
    {
      cockpit_id: "seed-p4",
      name: "Dieter Deacon",
      email: "dieter@example.com",
      username: "dieter",
      code: "dieter-code",
      competences: ["reader", "sacristan"],
      active: true,
    },
  ];

  const personIdByCockpitId = new Map<string, string>();
  for (const p of persons) {
    const rec = await upsertByCockpitId(pb, "persons", p);
    personIdByCockpitId.set(p.cockpit_id, rec.id);
  }
  console.log(`persons: ${persons.length}`);

  const liturgies = [
    {
      key: "ordinary-green",
      name: "Sonntag im Jahreskreis",
      rank: "III",
      color: "green",
      reading1: "Jes 55,10-11",
      reading2: "Röm 8,18-23",
      psalm: "Ps 65",
      evangelium: "Mt 13,1-23",
    },
    {
      key: "ordinary-white",
      name: "Hochfest",
      rank: "I",
      color: "white",
      reading1: "",
      reading2: "",
      psalm: "",
      evangelium: "",
    },
  ];
  for (const l of liturgies) {
    await upsertByKey(pb, "liturgies", "key", l);
  }
  console.log(`liturgies: ${liturgies.length}`);

  // Create 3 liturgy_events over the coming weeks.
  const now = new Date();
  const events = [0, 7, 14].map((offsetDays, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(10, 0, 0, 0);
    return {
      cockpit_id: `seed-e${i + 1}`,
      calendar_event_id: `seed-cal-e${i + 1}`,
      date: d.toISOString(),
      liturgy_name: "ordinary-green",
      cancellations: [],
    };
  });
  const eventIdByCockpitId = new Map<string, string>();
  for (const e of events) {
    const rec = await upsertByCockpitId(pb, "liturgy_events", e);
    eventIdByCockpitId.set(e.cockpit_id, rec.id);
  }
  console.log(`liturgy_events: ${events.length}`);

  // A few roster assignments: first event gets a reader and a sacristan.
  const rosters = [
    {
      cockpit_id: "seed-r1",
      liturgy_event: eventIdByCockpitId.get("seed-e1")!,
      person: personIdByCockpitId.get("seed-p1")!,
      person_name: "Anna Acolyte",
      position: "READER1",
      status: "assigned",
    },
    {
      cockpit_id: "seed-r2",
      liturgy_event: eventIdByCockpitId.get("seed-e1")!,
      person: personIdByCockpitId.get("seed-p2")!,
      person_name: "Ben Bell-ringer",
      position: "SACRISTAN",
      status: "informed",
    },
    {
      cockpit_id: "seed-r3",
      liturgy_event: eventIdByCockpitId.get("seed-e2")!,
      person: personIdByCockpitId.get("seed-p3")!,
      person_name: "Clara Cantor",
      position: "MUSICIAN",
      status: "assigned",
    },
  ];
  for (const r of rosters) {
    await upsertByCockpitId(pb, "liturgy_rosters", r);
  }
  console.log(`liturgy_rosters: ${rosters.length}`);

  // A current weekly so the homepage/wochenblatt pages have data.
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  await upsertByKey(pb, "weeklies", "name", {
    name: `Seed-Woche ${iso(monday)}`,
    start: iso(monday),
    end: iso(sunday),
    sent: false,
    data: {
      evangelium: { title: "Seed-Evangelium", text: "<p>Lorem ipsum</p>" },
      tiles: [
        { type: "ARTICLE", title: "Seed-Artikel", text: "<p>Hallo Welt</p>" },
      ],
      events: [],
    },
  });
  console.log("weeklies: 1");

  // Admin logins authenticate against `_superusers` (see persons-repo.ts);
  // locally that's the ADMIN_EMAIL/ADMIN_PASSWORD superuser, so no extra
  // seed data is needed.

  console.log("Seed complete.");
}

async function upsertByCockpitId<T extends { cockpit_id: string }>(
  pb: PocketBase,
  collection: string,
  record: T,
) {
  const existing = await findOne(
    pb,
    collection,
    `cockpit_id = "${record.cockpit_id}"`,
  );
  return existing
    ? pb.collection(collection).update(existing.id, record)
    : pb.collection(collection).create(record);
}

async function upsertByKey<T>(
  pb: PocketBase,
  collection: string,
  keyField: keyof T & string,
  record: T,
) {
  const existing = await findOne(
    pb,
    collection,
    `${keyField} = "${record[keyField]}"`,
  );
  return existing
    ? pb.collection(collection).update(existing.id, record)
    : pb.collection(collection).create(record);
}

async function findOne(pb: PocketBase, collection: string, filter: string) {
  try {
    return await pb.collection(collection).getFirstListItem(filter);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      err.status === 404
    ) {
      return null;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
