/**
 * One-time (idempotent) migration from Cockpit to Pocketbase.
 *
 * Migrates the four liturgy-related collections:
 *   CpPerson         -> persons
 *   CpLiturgy        -> liturgies (one row per (date, position) — the Cockpit
 *                                  singleton holds 1+ entries per date)
 *   CpLiturgyEvent   -> liturgy_events
 *   CpLiturgyRoster  -> liturgy_rosters  (with relations resolved to PB ids)
 *
 * Idempotent: every collection has a `cockpit_id` (or `(key, position)` for
 * liturgies) unique index, and this script upserts by that key. Safe to re-run.
 *
 * Targets:
 *   LOCAL  — POCKETBASE_URL=http://localhost:8090 (docker compose)
 *   PROD   — POCKETBASE_URL=http://localhost:8091 (kubectl port-forward)
 *
 * Safety: refuses to run unless the URL is a localhost port (8090 or 8091) OR
 * ALLOW_ANY_PB=1 is set. This makes it harder to point the script at the wrong
 * PB by accident.
 *
 * Usage (PHASES is required; cut-over phases also need
 * I_KNOW_THIS_OVERWRITES_PB=1 — see resolvePhases):
 *   # Local smoke test
 *   PHASES=cache POCKETBASE_URL=http://localhost:8090 \
 *     PB_ADMIN_EMAIL=admin@emmaus.local \
 *     PB_ADMIN_PASSWORD=devpassword \
 *     bun scripts/migrate-cockpit-to-pb.ts
 *
 *   # Prod (requires `bun pb:prod:tunnel` running in another terminal)
 *   POCKETBASE_URL=http://localhost:8091 \
 *     PB_ADMIN_EMAIL=admin@emmaus.wien \
 *     PB_ADMIN_PASSWORD=... \
 *     bun scripts/migrate-cockpit-to-pb.ts
 *
 *   # Dry run (reads Cockpit, prints what it would write, touches nothing)
 *   DRY_RUN=1 ... bun scripts/migrate-cockpit-to-pb.ts
 */

import "dotenv/config";
import PocketBase, { type RecordModel } from "pocketbase";
import {
  assertMediaResponse,
  assertNoMigrationFailures,
  migrationAssetUrl,
  validateMigrationPayload,
} from "./migration-validation";
import {
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
  fetchCpAlphaRegistration,
  fetchCpArticles,
  fetchCpCache,
  fetchCpEmmausbote,
  fetchCpImpressum,
  fetchCpLiturgy,
  fetchCpLiturgyEvent,
  fetchCpLiturgyRoster,
  fetchCpNewsletter,
  fetchCpPaperArticles,
  fetchCpPaperProjects,
  fetchCpPaperStats,
  fetchCpPaperTexts,
  fetchCpPerson,
  fetchCpReservations,
  fetchCpSharedLinks,
  fetchCpSite,
  fetchCpWeeklyE,
  type CpLiturgyEvent,
  type CpLiturgyRoster,
  type CpPerson,
} from "../util/cockpit.generated";

const PB_URL = process.env.POCKETBASE_URL ?? "http://localhost:8090";
const PB_EMAIL = process.env.PB_ADMIN_EMAIL ?? "admin@emmaus.local";
const PB_PASSWORD = process.env.PB_ADMIN_PASSWORD ?? "devpassword";
const DRY_RUN = process.env.DRY_RUN === "1";
const ALLOW_ANY_PB = process.env.ALLOW_ANY_PB === "1";

/**
 * Phase selection — REQUIRED. Once a collection has been cut over to PB
 * (the app writes to PB directly), re-running its phase would overwrite
 * newer PB data with stale Cockpit state. Therefore:
 *   - PHASES must be passed explicitly (comma-separated), e.g. PHASES=cache
 *   - phases for cut-over collections additionally require
 *     I_KNOW_THIS_OVERWRITES_PB=1
 *
 * Cut-over so far: persons, liturgies, liturgy_events, liturgy_rosters
 * (2026-07-20). Add newly cut-over collections to CUT_OVER below.
 */
const ALL_PHASES = [
  "persons",
  "liturgies",
  "liturgy_events",
  "liturgy_rosters",
  "cache",
  "reservations",
  "newsletter",
  "shared_links",
  "alpha_registrations",
  "weeklies",
  "paper_projects",
  "paper_articles",
  "paper_texts",
  "paper_stats",
  "content",
] as const;
type Phase = (typeof ALL_PHASES)[number];
const CUT_OVER: Phase[] = [
  "persons",
  "liturgies",
  "liturgy_events",
  "liturgy_rosters",
  "cache",
  // forms batch — cut over 2026-07-20:
  "reservations",
  "newsletter",
  "shared_links",
  "alpha_registrations",
  // cut over 2026-07-20:
  "weeklies",
  "paper_projects",
  "paper_articles",
  "paper_texts",
  "paper_stats",
  // content slice — cut over 2026-07-20:
  "content",
];

function resolvePhases(): Phase[] {
  const raw = (process.env.PHASES ?? "").trim();
  if (!raw) {
    console.error(
      "PHASES is required (comma-separated). Available: " +
        ALL_PHASES.join(", ") +
        "\nExample: PHASES=cache bun scripts/migrate-cockpit-to-pb.ts",
    );
    process.exit(2);
  }
  const phases = raw.split(",").map((p) => p.trim()) as Phase[];
  const unknown = phases.filter((p) => !ALL_PHASES.includes(p));
  if (unknown.length > 0) {
    console.error(`Unknown phase(s): ${unknown.join(", ")}`);
    process.exit(2);
  }
  const dangerous = phases.filter((p) => CUT_OVER.includes(p));
  if (
    dangerous.length > 0 &&
    !DRY_RUN &&
    process.env.I_KNOW_THIS_OVERWRITES_PB !== "1"
  ) {
    console.error(
      `Phase(s) ${dangerous.join(", ")} target collections that are already ` +
        `cut over to PB — running them would overwrite newer PB data with ` +
        `stale Cockpit state. If you REALLY mean it (e.g. restoring after a ` +
        `wipe), set I_KNOW_THIS_OVERWRITES_PB=1.`,
    );
    process.exit(2);
  }
  return phases;
}

function assertSafeTarget() {
  if (ALLOW_ANY_PB) return;
  const ok = /^http:\/\/(localhost|127\.0\.0\.1):(8090|8091)(\/|$)/.test(
    PB_URL,
  );
  if (!ok) {
    console.error(
      `Refusing to migrate against ${PB_URL}. Expected a localhost port-forward ` +
        `(8090 local / 8091 prod tunnel). Set ALLOW_ANY_PB=1 to override.`,
    );
    process.exit(2);
  }
}

async function main() {
  assertSafeTarget();
  const phases = resolvePhases();
  const failures: string[] = [];

  console.log(
    `Target: ${PB_URL}${DRY_RUN ? " (DRY RUN — no writes)" : ""}\n` +
      `Admin:  ${PB_EMAIL}\n`,
  );

  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb.collection("_superusers").authWithPassword(PB_EMAIL, PB_PASSWORD);

  console.log(`Phases: ${phases.join(", ")}\n`);

  // Cockpit-id -> PB-id maps, loaded from PB so each phase can run
  // independently (e.g. rosters without re-running persons/events).
  async function mapFromPb(collection: string): Promise<Map<string, string>> {
    const rows = await pb.collection(collection).getFullList();
    return new Map(
      rows
        .filter((r) => r.cockpit_id)
        .map((r) => [r.cockpit_id as string, r.id]),
    );
  }

  // --- Phase 1: persons ---
  if (phases.includes("persons")) {
    console.log("Phase 1 — persons");
    const cpPersons = await fetchCpPerson();
    const personPbIdByCockpitId = new Map<string, string>();
    let personNew = 0;
    let personUpdated = 0;
    for (const p of cpPersons) {
      const existing = await findOne(pb, "persons", `cockpit_id = "${p._id}"`);
      const payload = personPayload(p);
      if (DRY_RUN) {
        personPbIdByCockpitId.set(p._id, existing?.id ?? `dry-${p._id}`);
        existing ? personUpdated++ : personNew++;
        continue;
      }
      const saved = existing
        ? await pb.collection("persons").update(existing.id, payload)
        : await pb.collection("persons").create(payload);
      personPbIdByCockpitId.set(p._id, saved.id);
      existing ? personUpdated++ : personNew++;
    }
    console.log(`  created=${personNew} updated=${personUpdated}\n`);
  }

  // --- Phase 2: liturgies ---
  if (phases.includes("liturgies")) {
    console.log("Phase 2 — liturgies");
    const cpLiturgy = await fetchCpLiturgy();
    // Flatten { date -> liturgy[] } into [{date, position, ...}, ...].
    const flatLiturgies: Array<{
      key: string;
      position: number;
      name: string;
      rank: string;
      color: string;
      reading1: string;
      reading2: string;
      psalm: string;
      evangelium: string;
    }> = [];
    for (const [dateKey, variants] of Object.entries(cpLiturgy)) {
      const arr = Array.isArray(variants) ? variants : [];
      arr.forEach((v, i) => {
        flatLiturgies.push({
          key: dateKey,
          position: i,
          name: v?.name ?? "",
          rank: v?.rank ?? "",
          color: v?.color ?? "",
          reading1: v?.reading1 ?? "",
          reading2: v?.reading2 ?? "",
          psalm: v?.psalm ?? "",
          evangelium: v?.evangelium ?? "",
        });
      });
    }
    let liturgyNew = 0;
    let liturgyUpdated = 0;
    for (const l of flatLiturgies) {
      // Escape quotes — keys are dates so unlikely to contain any, but be safe.
      const filter = `key = "${l.key.replace(/"/g, '\\"')}" && position = ${l.position}`;
      const existing = await findOne(pb, "liturgies", filter);
      if (DRY_RUN) {
        existing ? liturgyUpdated++ : liturgyNew++;
        continue;
      }
      if (existing) {
        await pb.collection("liturgies").update(existing.id, l);
        liturgyUpdated++;
      } else {
        await pb.collection("liturgies").create(l);
        liturgyNew++;
      }
    }
    console.log(
      `  total flat rows=${flatLiturgies.length} created=${liturgyNew} updated=${liturgyUpdated}\n`,
    );
  }

  // --- Phase 3: liturgy_events ---
  if (phases.includes("liturgy_events")) {
    console.log("Phase 3 — liturgy_events");
    const cpLiturgyEvents = await fetchCpLiturgyEvent();
    let eventNew = 0;
    let eventUpdated = 0;
    for (const e of cpLiturgyEvents) {
      const existing = await findOne(
        pb,
        "liturgy_events",
        `cockpit_id = "${e._id}"`,
      );
      const payload = liturgyEventPayload(e);
      if (DRY_RUN) {
        existing ? eventUpdated++ : eventNew++;
        continue;
      }
      if (existing) {
        await pb.collection("liturgy_events").update(existing.id, payload);
        eventUpdated++;
      } else {
        await pb.collection("liturgy_events").create(payload);
        eventNew++;
      }
    }
    console.log(`  created=${eventNew} updated=${eventUpdated}\n`);
  }

  // --- Phase 4: liturgy_rosters ---
  if (phases.includes("liturgy_rosters")) {
    console.log("Phase 4 — liturgy_rosters");
    const cpRosters = await fetchCpLiturgyRoster();
    // Resolve relations against the PB state (works standalone).
    const eventPbIdByCockpitId = await mapFromPb("liturgy_events");
    const personPbIdByCockpitId = await mapFromPb("persons");
    let rosterNew = 0;
    let rosterUpdated = 0;
    let rosterSkippedOrphan = 0; // all-null garbage rows in Cockpit
    let rosterSkippedMissing = 0; // referenced event/person not in PB
    let rosterSkippedError = 0;
    const skippedSamples: string[] = [];
    for (const r of cpRosters) {
      // Cockpit has hundreds of "ghost" rosters with all fields null except status.
      // These aren't real assignments — skip quietly and count them as orphans.
      if (!r.liturgyEventId && !r.userId && !r.position) {
        rosterSkippedOrphan++;
        continue;
      }
      const eventPbId = r.liturgyEventId
        ? eventPbIdByCockpitId.get(r.liturgyEventId)
        : undefined;
      if (!eventPbId) {
        rosterSkippedMissing++;
        if (skippedSamples.length < 10)
          skippedSamples.push(
            `roster ${r._id}: liturgy_event ${r.liturgyEventId} not found in PB`,
          );
        continue;
      }
      const personPbId = r.userId
        ? personPbIdByCockpitId.get(r.userId)
        : undefined;
      if (r.userId && !personPbId) {
        rosterSkippedMissing++;
        if (skippedSamples.length < 10)
          skippedSamples.push(
            `roster ${r._id}: person ${r.userId} not found in PB`,
          );
        continue;
      }

      const existing = await findOne(
        pb,
        "liturgy_rosters",
        `cockpit_id = "${r._id}"`,
      );
      const payload = rosterPayload(r, eventPbId, personPbId);
      if (DRY_RUN) {
        existing ? rosterUpdated++ : rosterNew++;
        continue;
      }
      try {
        if (existing) {
          await pb.collection("liturgy_rosters").update(existing.id, payload);
          rosterUpdated++;
        } else {
          await pb.collection("liturgy_rosters").create(payload);
          rosterNew++;
        }
      } catch (err) {
        rosterSkippedError++;
        if (skippedSamples.length < 10)
          skippedSamples.push(`roster ${r._id}: ${describeError(err)}`);
      }
    }
    console.log(
      `  created=${rosterNew} updated=${rosterUpdated} ` +
        `skipped_orphan=${rosterSkippedOrphan} ` +
        `skipped_missing=${rosterSkippedMissing} ` +
        `skipped_error=${rosterSkippedError}`,
    );
    if (skippedSamples.length > 0) {
      console.log("  skip samples:");
      for (const s of skippedSamples) console.log(`    - ${s}`);
    }
    console.log();
    if (rosterSkippedError)
      failures.push(`liturgy_rosters: ${rosterSkippedError} writes failed`);
    if (rosterSkippedMissing)
      failures.push(
        `liturgy_rosters: ${rosterSkippedMissing} unresolved references`,
      );
  }

  // --- Phase 5: cache ---
  if (phases.includes("cache")) {
    // Keys are full prompts (newlines, quotes, several KB), so PB filter
    // strings are unsafe — diff in JS against a full dump instead.
    console.log("Phase 5 — cache");
    const cpCache = await fetchCpCache();
    const pbCacheRows = DRY_RUN
      ? []
      : await pb.collection("cache").getFullList();
    const pbCacheByKey = new Map(pbCacheRows.map((r) => [r.key as string, r]));
    // Cockpit may contain duplicate keys; last one wins (PB key is unique).
    const cacheByKey = new Map(cpCache.map((c) => [c.key, c]));
    let cacheNew = 0;
    let cacheUpdated = 0;
    let cacheUnchanged = 0;
    for (const [key, c] of cacheByKey) {
      const existing = pbCacheByKey.get(key);
      const payload = { cockpit_id: c._id, key, value: c.value ?? "" };
      if (DRY_RUN) {
        cacheNew++;
        continue;
      }
      if (!existing) {
        await pb.collection("cache").create(payload);
        cacheNew++;
      } else if (existing.value !== payload.value) {
        await pb.collection("cache").update(existing.id, payload);
        cacheUpdated++;
      } else {
        cacheUnchanged++;
      }
    }
    console.log(
      `  cockpit rows=${cpCache.length} (unique keys=${cacheByKey.size}) ` +
        `created=${cacheNew} updated=${cacheUpdated} unchanged=${cacheUnchanged}\n`,
    );
  }

  // --- Phases 6–9: forms batch (generic upsert by cockpit_id) ---
  async function upsertPhase(
    phase: Phase,
    collection: string,
    rows: Array<{ _id: string }>,
    payloadOf: (row: any) => Record<string, unknown>,
  ) {
    if (!phases.includes(phase)) return;
    console.log(`Phase — ${collection}`);
    const schema = await pb.collections.getOne(collection);
    const validationErrors = rows.flatMap((row) =>
      validateMigrationPayload(
        { cockpit_id: row._id, ...payloadOf(row) },
        schema.fields,
      ).map((error) => `${collection}/${row._id}: ${error}`),
    );
    assertNoMigrationFailures(validationErrors);
    // Prefetch existing rows once instead of a findOne per row.
    const existingByCockpitId = DRY_RUN
      ? new Map<string, { id: string }>()
      : new Map(
          (
            await pb
              .collection(collection)
              .getFullList({ fields: "id,cockpit_id" })
          )
            .filter((r) => r.cockpit_id)
            .map((r) => [r.cockpit_id as string, { id: r.id }]),
        );
    let created = 0;
    let updated = 0;
    let errored = 0;
    const samples: string[] = [];
    for (const row of rows) {
      const existing = existingByCockpitId.get(row._id);
      if (DRY_RUN) {
        existing ? updated++ : created++;
        continue;
      }
      try {
        const payload = { cockpit_id: row._id, ...payloadOf(row) };
        if (existing) {
          await pb.collection(collection).update(existing.id, payload);
          updated++;
        } else {
          await pb.collection(collection).create(payload);
          created++;
        }
      } catch (err) {
        errored++;
        if (samples.length < 5)
          samples.push(`${row._id}: ${describeError(err)}`);
      }
    }
    console.log(
      `  cockpit rows=${rows.length} created=${created} updated=${updated} errors=${errored}`,
    );
    for (const s of samples) console.log(`    - ${s}`);
    if (errored) failures.push(`${collection}: ${errored} writes failed`);
    console.log();
  }

  if (phases.includes("reservations")) {
    await upsertPhase(
      "reservations",
      "reservations",
      await fetchCpReservations(),
      (r) => ({
        occasion: r.occasion ?? "",
        times: Array.isArray(r.times) ? r.times : [],
        contact_name: r.contact_name ?? "",
        contact_phone: r.contact_phone ?? "",
        contact_relation: r.contact_relation ?? "",
        contact_mail: r.contact_mail ?? "",
        rooms: Array.isArray(r.rooms) ? r.rooms : [],
        access: !!r.access,
        access_via: r.access_via ?? "",
        approved_sitemanager: r.approved_sitemanager ?? "",
        approved_sitemanager_at: !!r.approved_sitemanager_at,
        sitemanager_secret: r.sitemanager_secret ?? "",
        approved_reverend: r.approved_reverend ?? "",
        approved_reverend_at: !!r.approved_reverend_at,
        reverend_secret: r.reverend_secret ?? "",
      }),
    );
  }

  if (phases.includes("newsletter")) {
    await upsertPhase(
      "newsletter",
      "newsletter",
      await fetchCpNewsletter(),
      (n) => ({
        mail: n.mail ?? "",
        token: n.token ?? "",
        active: !!n.active,
      }),
    );
  }

  if (phases.includes("shared_links")) {
    await upsertPhase(
      "shared_links",
      "shared_links",
      await fetchCpSharedLinks(),
      (s) => ({
        expiration: s.expiration ? new Date(s.expiration).toISOString() : "",
        folder: s.folder ?? "",
        ids: Array.isArray(s.ids) ? s.ids : [],
      }),
    );
  }

  if (phases.includes("weeklies")) {
    await upsertPhase("weeklies", "weeklies", await fetchCpWeeklyE(), (w) => ({
      name: w.name ?? "",
      start: w.start ?? "",
      end: w.end ?? "",
      data: w.data ?? {},
      sent: !!w.sent,
    }));
  }

  if (phases.includes("alpha_registrations")) {
    await upsertPhase(
      "alpha_registrations",
      "alpha_registrations",
      await fetchCpAlphaRegistration(),
      (a) => ({
        name: a.name ?? "",
        phone: a.phone ?? "",
        mail: a.mail ?? "",
        postal: a.postal ?? "",
      }),
    );
  }

  // --- Phases: paper (redaktion) ---
  if (phases.includes("paper_projects")) {
    await upsertPhase(
      "paper_projects",
      "paper_projects",
      await fetchCpPaperProjects(),
      (p) => ({
        name: p.name ?? "",
        deadline: p.deadline ?? "",
        printrelease: p.printrelease ?? "",
      }),
    );
  }

  if (phases.includes("paper_articles")) {
    const projectMap = await mapFromPb("paper_projects");
    const rows = (await fetchCpPaperArticles()).filter((a) => {
      if (a.project?._id && projectMap.has(a.project._id)) return true;
      console.log(`  skipping article ${a._id}: project not in PB`);
      failures.push(`paper_articles/${a._id}: unresolved project`);
      return false;
    });
    await upsertPhase("paper_articles", "paper_articles", rows, (a) => ({
      name: a.name ?? "",
      project: projectMap.get(a.project._id),
      status: a.status ?? "writing",
      author: a.author ?? "",
      format: a.format ?? "",
      char_min: a.char_min ?? 0,
      char_max: a.char_max ?? 0,
      gid: a.gid ?? "",
    }));
  }

  if (phases.includes("paper_texts")) {
    const articleMap = await mapFromPb("paper_articles");
    const rows = (await fetchCpPaperTexts()).filter((t) => {
      if (t.article?._id && articleMap.has(t.article._id)) return true;
      console.log(`  skipping text ${t._id}: article not in PB`);
      failures.push(`paper_texts/${t._id}: unresolved article`);
      return false;
    });
    await upsertPhase("paper_texts", "paper_texts", rows, (t) => ({
      article: articleMap.get(t.article._id),
      text: t.text ?? "",
      datetime: t.datetime ?? "",
    }));
  }

  if (phases.includes("paper_stats")) {
    const projectMap = await mapFromPb("paper_projects");
    const rows = (await fetchCpPaperStats()).filter((s) => {
      if (s.project?._id && projectMap.has(s.project._id)) return true;
      console.log(`  skipping stats ${s._id}: project not in PB`);
      failures.push(`paper_stats/${s._id}: unresolved project`);
      return false;
    });
    await upsertPhase("paper_stats", "paper_stats", rows, (s) => ({
      project: projectMap.get(s.project._id),
      day: s.day ?? "",
      writing: s.writing ?? 0,
      written: s.written ?? 0,
      corrected: s.corrected ?? 0,
      finished: s.finished ?? 0,
    }));
  }

  // --- Phase: content (sites, articles, emmausbote, impressum + files) ---
  //
  // Downloads binary assets from Cockpit and re-uploads them into PB file
  // fields. Assets referenced from inside stored HTML land in the
  // `content_assets` collection and the HTML is rewritten to point at the
  // PB file URLs. The Cockpit `article` collection (singular) is NOT
  // migrated — it has no consumers in the app.
  if (phases.includes("content")) {
    const CP_HOST = (process.env.COCKPIT_HOST ?? "").replace(/\/$/, "");
    if (!CP_HOST) {
      console.error("COCKPIT_HOST must be set for the content phase.");
      process.exit(2);
    }
    // Public base URL baked into the rewritten HTML. Must be what browsers
    // will use — for the prod tunnel that's the public PB ingress.
    const PB_PUBLIC_URL = (
      process.env.PB_PUBLIC_URL ??
      (PB_URL.includes(":8091") ? "https://db.emmaus.wien" : PB_URL)
    ).replace(/\/$/, "");
    console.log(`Phase — content (asset URLs rewritten to ${PB_PUBLIC_URL})`);

    // ---- Cockpit asset download + re-upload into `content_assets` ----
    const assetByPath = new Map<string, { id: string; filename: string }>();
    if (!DRY_RUN) {
      for (const r of await pb
        .collection("content_assets")
        .getFullList({ fields: "id,cockpit_path,file" })) {
        assetByPath.set(r.cockpit_path as string, {
          id: r.id,
          filename: r.file as string,
        });
      }
    }
    let assetsUploaded = 0;
    let assetsFailed = 0;

    async function downloadCpFile(cockpitPath: string): Promise<File | null> {
      const srcUrl = migrationAssetUrl(CP_HOST, cockpitPath);
      try {
        const res = await fetch(srcUrl);
        if (!res.ok) {
          assetsFailed++;
          console.log(`    ! asset ${cockpitPath}: HTTP ${res.status}`);
          return null;
        }
        const buf = await res.arrayBuffer();
        assertMediaResponse(
          res.headers.get("content-type") ?? "",
          new Uint8Array(buf),
        );
        const rawName = new URL(srcUrl).pathname.split("/").pop() || "file";
        let filename: string;
        try {
          filename = decodeURIComponent(rawName);
        } catch {
          filename = rawName;
        }
        filename = filename.slice(-100) || "file";
        return new File([buf], filename, {
          type: res.headers.get("content-type") ?? "application/octet-stream",
        });
      } catch (err) {
        assetsFailed++;
        console.log(`    ! asset ${cockpitPath}: ${describeError(err)}`);
        return null;
      }
    }

    /** Upload (once) a Cockpit storage asset; returns its public PB URL. */
    async function ensureAsset(cockpitPath: string): Promise<string | null> {
      const cached = assetByPath.get(cockpitPath);
      if (cached?.filename) {
        return `${PB_PUBLIC_URL}/api/files/content_assets/${cached.id}/${encodeURIComponent(cached.filename)}`;
      }
      const file = await downloadCpFile(cockpitPath);
      if (!file) return null;
      assetsUploaded++;
      if (DRY_RUN) {
        return `${PB_PUBLIC_URL}/api/files/content_assets/DRYRUN/${encodeURIComponent(file.name)}`;
      }
      const payload = { cockpit_path: cockpitPath, file };
      const rec = cached
        ? await pb.collection("content_assets").update(cached.id, payload)
        : await pb.collection("content_assets").create(payload);
      assetByPath.set(cockpitPath, {
        id: rec.id,
        filename: rec.file as string,
      });
      return `${PB_PUBLIC_URL}/api/files/content_assets/${rec.id}/${encodeURIComponent(rec.file as string)}`;
    }

    // Rewrite Cockpit storage references (absolute data.emmaus.wien /
    // data.eni.wien URLs and relative /storage/uploads/... paths) inside
    // stored HTML to point at the re-uploaded PB files.
    const ABS_RE =
      /https?:\/\/data\.(?:emmaus|eni)\.wien\/(storage\/[^"'\s<>)]+)/g;
    const REL_RE = /(?:src|href)="(\/?storage\/uploads\/[^"]+)"/g;
    async function rewriteHtml(html: string): Promise<string> {
      if (!html) return "";
      const targets = new Map<string, string>(); // matched url -> cockpit path
      for (const m of html.matchAll(ABS_RE)) targets.set(m[0], m[1]);
      for (const m of html.matchAll(REL_RE))
        targets.set(m[1], m[1].replace(/^\//, ""));
      let out = html;
      for (const [orig, path] of targets) {
        const newUrl = await ensureAsset(path.replace(/&amp;/g, "&"));
        if (newUrl) out = out.split(orig).join(newUrl);
      }
      return out;
    }

    async function existingMap(collection: string, fields: string) {
      if (DRY_RUN) return new Map<string, RecordModel>();
      return new Map<string, RecordModel>(
        (await pb.collection(collection).getFullList({ fields }))
          .filter((r) => r.cockpit_id)
          .map((r) => [r.cockpit_id as string, r]),
      );
    }

    // Re-running the phase must NOT touch records whose data didn't change:
    // the repos treat `updated != created` as "edited in PB" and would stop
    // showing the preserved Cockpit `_modified` date otherwise.
    function isUnchanged(
      prior: RecordModel,
      payload: Record<string, unknown>,
    ): boolean {
      return Object.entries(payload).every(([k, v]) => {
        if (v instanceof File) return false; // new file to upload
        const cur = prior[k];
        if (typeof v === "boolean") return !!cur === v;
        if (typeof v === "number") return Number(cur ?? 0) === v;
        return String(cur ?? "") === String(v ?? "");
      });
    }

    // ---- sites (Cockpit returns the nested tree; flatten with parent) ----
    {
      const cpSites = (await fetchCpSite()) as any[];
      const existing = await existingMap(
        "sites",
        "id,cockpit_id,name,slug,title,summary,icon,html,sort_order,parent,cockpit_created,cockpit_modified",
      );
      let created = 0;
      let updated = 0;
      let unchanged = 0;
      let skipped = 0;

      async function upsertSite(
        node: any,
        parentPbId: string,
        order: number,
      ): Promise<void> {
        if (!node?._id) {
          skipped++;
          failures.push("sites: source node without an id");
          return;
        }
        const html = await rewriteHtml(
          (Array.isArray(node.layout) ? node.layout : [])
            .filter((l: any) => l?.component === "text")
            .map((l: any) => l?.settings?.text ?? "")
            .join("\n"),
        );
        const payload = {
          cockpit_id: node._id,
          name: node.name ?? "",
          slug: node.slug ?? "",
          title: node.title ?? "",
          summary: node.summary ?? "",
          icon: node.icon ?? "",
          html,
          sort_order: order,
          parent: parentPbId,
          cockpit_created: node._created ?? 0,
          cockpit_modified: node._modified ?? 0,
        };
        let pbId = "DRYRUN";
        const prior = existing.get(node._id);
        if (DRY_RUN) {
          prior ? updated++ : created++;
        } else if (prior && isUnchanged(prior, payload)) {
          pbId = prior.id;
          unchanged++;
        } else if (prior) {
          await pb.collection("sites").update(prior.id, payload);
          pbId = prior.id;
          updated++;
        } else {
          const rec = await pb.collection("sites").create(payload);
          pbId = rec.id;
          created++;
        }
        const children = Array.isArray(node.children) ? node.children : [];
        for (let i = 0; i < children.length; i++) {
          await upsertSite(children[i], pbId, i);
        }
      }

      for (let i = 0; i < cpSites.length; i++) {
        await upsertSite(cpSites[i], "", i);
      }
      console.log(
        `  sites: created=${created} updated=${updated} unchanged=${unchanged} skipped(no _id)=${skipped}`,
      );
    }

    // ---- articles ----
    // Intentionally no longer imported. The `articles_publish_date` migration
    // dropped `cockpit_id` (the idempotency key this phase matched on) together
    // with `published_at` / `cockpit_created`, because the publication date is
    // now plain PB `created` and the public id is the plain PB `id`. Articles
    // were cut over on 2026-07-20 and are edited in PB only, so re-importing
    // them would overwrite newer state anyway.

    // ---- emmausbote (PDF + preview image per issue) ----
    {
      const cpIssues = await fetchCpEmmausbote();
      const existing = await existingMap(
        "emmausbote",
        "id,cockpit_id,date,file,preview",
      );
      let created = 0;
      let updated = 0;
      let unchanged = 0;
      let errored = 0;
      for (const e of cpIssues) {
        try {
          const prior = existing.get(e._id);
          const payload: Record<string, unknown> = {
            cockpit_id: e._id,
            date: e.date ?? "",
          };
          // Cockpit stores `file`/`preview` as {path} — or "" when unset.
          const fileRef = e.file as unknown as { path?: string } | string;
          const previewRef = e.preview as unknown as { path?: string } | string;
          const filePath =
            typeof fileRef === "object" && fileRef?.path
              ? fileRef.path.replace(/^\//, "")
              : "";
          const previewPath =
            typeof previewRef === "object" && previewRef?.path
              ? previewRef.path.replace(/^\//, "")
              : "";
          if (filePath && !prior?.file) {
            const f = await downloadCpFile(filePath);
            if (f) payload.file = f;
          }
          if (previewPath && !prior?.preview) {
            const f = await downloadCpFile(previewPath);
            if (f) payload.preview = f;
          }
          if (DRY_RUN) {
            prior ? updated++ : created++;
          } else if (prior && isUnchanged(prior, payload)) {
            unchanged++;
          } else if (prior) {
            await pb.collection("emmausbote").update(prior.id, payload);
            updated++;
          } else {
            await pb.collection("emmausbote").create(payload);
            created++;
          }
        } catch (err) {
          errored++;
          console.log(`    ! emmausbote ${e._id}: ${describeError(err)}`);
        }
      }
      console.log(
        `  emmausbote: cockpit rows=${cpIssues.length} created=${created} updated=${updated} unchanged=${unchanged} errors=${errored}`,
      );
      if (errored) failures.push(`emmausbote: ${errored} writes failed`);
    }

    // ---- impressum (Cockpit internal-data singleton -> single PB row) ----
    {
      // The Cockpit id of the internal-data entry holding the impressum
      // (see fetchCpImpressum in util/cockpit.generated.ts).
      const IMPRESSUM_COCKPIT_ID = "675df468613062eb9e0000ed";
      const imp = await fetchCpImpressum();
      const existing = await existingMap(
        "impressum",
        "id,cockpit_id,title,content",
      );
      const payload = {
        cockpit_id: IMPRESSUM_COCKPIT_ID,
        title: imp?.title ?? "",
        content: await rewriteHtml(imp?.content ?? ""),
      };
      const prior = existing.get(IMPRESSUM_COCKPIT_ID);
      if (DRY_RUN) {
        console.log(`  impressum: would ${prior ? "update" : "create"} 1 row`);
      } else if (prior && isUnchanged(prior, payload)) {
        console.log("  impressum: unchanged");
      } else if (prior) {
        await pb.collection("impressum").update(prior.id, payload);
        console.log("  impressum: updated 1 row");
      } else {
        await pb.collection("impressum").create(payload);
        console.log("  impressum: created 1 row");
      }
    }

    console.log(
      `  content_assets: uploaded=${assetsUploaded} failed-downloads=${assetsFailed}\n`,
    );
    if (assetsFailed)
      failures.push(`content_assets: ${assetsFailed} failed downloads`);
  }

  // --- Summary ---
  assertNoMigrationFailures(failures);
  console.log(
    "Done. Run scripts/audit-cockpit-to-pb.py to verify completeness.",
  );
  if (DRY_RUN) return;

  const counts = await Promise.all(
    [
      "persons",
      "liturgies",
      "liturgy_events",
      "liturgy_rosters",
      "cache",
      "reservations",
      "newsletter",
      "shared_links",
      "alpha_registrations",
      "weeklies",
      "paper_projects",
      "paper_articles",
      "paper_texts",
      "paper_stats",
      "sites",
      "articles",
      "emmausbote",
      "impressum",
      "content_assets",
    ].map(
      async (c) =>
        `  ${c}: ${(await pb.collection(c).getList(1, 1)).totalItems}`,
    ),
  );
  console.log(`\nFinal PB counts:\n${counts.join("\n")}`);
}

function personPayload(p: CpPerson) {
  return {
    cockpit_id: p._id,
    name: p.name ?? "",
    email: p.email ?? "",
    username: p.username ?? "",
    code: p.code ?? "",
    active: !!p.active,
    last_login: p.last_login ? new Date(p.last_login).toISOString() : "",
    competences: Array.isArray(p.competences) ? p.competences : [],
  };
}

function liturgyEventPayload(e: CpLiturgyEvent) {
  // Cockpit stores "YYYY-MM-DD" — convert to full ISO so PB accepts it.
  const date = e.date ? new Date(`${e.date}T00:00:00.000Z`).toISOString() : "";
  // `cancellations` can be null, an array, or an array of { value }.
  const cancellations = Array.isArray(e.cancellations)
    ? e.cancellations
        .map((c) => (typeof c === "string" ? c : (c?.value ?? null)))
        .filter((v): v is string => !!v)
    : [];
  return {
    cockpit_id: e._id,
    calendar_event_id: e.eventId ?? "",
    date,
    liturgy_name: e.liturgyName ?? "",
    cancellations,
  };
}

function rosterPayload(
  r: CpLiturgyRoster,
  eventPbId: string,
  personPbId: string | undefined,
) {
  return {
    cockpit_id: r._id,
    liturgy_event: eventPbId,
    person: personPbId ?? "",
    person_name: r.userName ?? "",
    position: asPosition(r.position),
    status: asStatus(r.status),
  };
}

function asPosition(v: unknown): string {
  // PB's select field will reject unknown values, which is what we want — if
  // Cockpit has a position value we don't know about, fail loudly.
  const allowed = Object.values(CpLiturgyRosterPosition);
  const s = String(v ?? "");
  if (!allowed.includes(s as CpLiturgyRosterPosition)) {
    throw new Error(`unknown position "${s}" (allowed: ${allowed.join(", ")})`);
  }
  return s;
}

function asStatus(v: unknown): string {
  const allowed = Object.values(CpLiturgyRosterStatus);
  const s = String(v ?? "");
  if (!allowed.includes(s as CpLiturgyRosterStatus)) {
    throw new Error(`unknown status "${s}" (allowed: ${allowed.join(", ")})`);
  }
  return s;
}

async function findOne(
  pb: PocketBase,
  collection: string,
  filter: string,
): Promise<RecordModel | null> {
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

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
