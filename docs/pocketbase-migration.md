# Cockpit → PocketBase migration — handoff note

_Last updated: 2026-07-20 (content + files finale migrated and cut over in
prod — the whole app is now PB-only)._

## TL;DR

**2026-09-21 audit:** the EB31 format omission has been repaired, but 19
imported article images contain HTML instead of images, one source person is
absent, and four record differences need review. See
[the full reconciliation report](migration-audit-2026-09-21.md). The cutover
status below does not imply every historical record or file is intact.

The app is PB-only: **all** collections, including the public site content
(`sites`, `articles`, `emmausbote`, `impressum`), read from PocketBase
(`https://db.emmaus.wien`, in-cluster `emmaus-pb`). Cockpit is fully frozen
— do not edit anything in the Cockpit admin; changes there are invisible to
the app. Website content is edited in the PB admin UI (`db.emmaus.wien/_/`)
via `editor` fields. Remaining work is just Cockpit retirement/cleanup (see
below).

## Migration status

| Slice                        | Collections                                                         | Status                                                                |
| ---------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Liturgy                      | `liturgies`, `liturgy_events`, `liturgy_rosters`                    | ✅ PB                                                                 |
| Persons + admin auth         | `persons`, `_superusers`                                            | ✅ PB (admins = PB superusers, login identity = email)                |
| ChatGPT cache                | `cache`                                                             | ✅ PB                                                                 |
| Forms                        | `reservations`, `newsletter`, `shared_links`, `alpha_registrations` | ✅ PB                                                                 |
| Wochenmitteilungen           | `weeklies`                                                          | ✅ PB                                                                 |
| Redaktion                    | `paper_projects`, `paper_articles`, `paper_texts`, `paper_stats`    | ✅ PB                                                                 |
| WhatsApp verification        | —                                                                   | 🗑 feature deleted entirely                                           |
| Public site content          | `sites`, `articles`, `emmausbote`, `impressum`, `content_assets`    | ✅ PB (cut over 2026-07-20)                                           |
| Cockpit `article` (singular) | —                                                                   | 🗑 not migrated: zero consumers in the app (137 dead rows in Cockpit) |

No backend env switches remain; all repos are PB-only. `PERSONS_BACKEND` in
`app/(domain)/users/persons-repo.ts` is a vestigial hardcoded const (its
Cockpit branch is dead code, safe to collapse).

## Architecture & conventions

- **Repo layer per domain** under `app/(domain)/*/`:
  `liturgy/liturgy-repo.pb.ts`, `users/persons-repo.ts`,
  `forms/forms-repo.ts`, `weekly/weekly-repo.ts`, `paper/paper-repo.ts`,
  `content/content-repo.ts`.
  They return the Cockpit-era shapes (`Cp*` types from
  `util/cockpit.generated.ts`) so UI code never changed. Exception: the
  content repo exposes its own types (`SiteStructure`, `ContentArticle`,
  …) because the shape changed anyway (layout flattened to `html`, file
  paths replaced by full URLs).
- **Id compatibility**: every migrated record keeps its Cockpit id in a
  `cockpit_id` column. Repos expose `_id = cockpit_id || pb id` and lookups
  accept either (`cockpit_id = {:id} || id = {:id}`). This keeps ids embedded
  in JWTs, share URLs, article URLs, and Slack messages working. Do not drop
  the `cockpit_id` columns until Cockpit is fully retired.
- **`_created`/`_modified`**: where consumers sort by these, the PB
  collection has `autodate` fields (`created`/`updated`) mapped to epoch
  seconds (`weeklies`, `paper_*`).
- **Preserved Cockpit timestamps (content)**: `sites`/`articles` display the
  original Cockpit dates publicly (article date, "Zuletzt geändert"), but PB
  autodates reset at import. The import stores the originals in
  `cockpit_created`/`cockpit_modified` (epoch seconds); the repo prefers them
  until a record is edited in the PB admin (detected via
  `updated != created`), after which PB's `updated` wins. The `content`
  migration phase therefore skips no-op updates on re-runs so `updated`
  never moves without a real change.
- **Files**: PB file fields (`articles.image`, `emmausbote.file`/`preview`)
  plus a `content_assets` collection for files referenced from inside stored
  HTML; the import rewrote those HTML references to PB file URLs
  (`/api/files/...`). URL helper: `util/pb-files.ts` (`pbFileUrl`), base URL
  from `PB_PUBLIC_URL` (optional) falling back to `POCKETBASE_URL`. Files
  are publicly served by PB regardless of the locked collection rules (no
  field is marked "protected").
- **Schema as code**: PB JS migrations in `deploy/helm/pb_migrations/` are
  the single source of truth. The same directory is mounted into the local
  docker instance and shipped via ConfigMap in the Helm chart; the PB pod
  restarts on migration changes (checksum annotation) and applies them at
  boot.
- **Types**: `pb/pocketbase-types.ts` is generated (`bun pb:types`, requires
  the local instance running). `util/pocketbase.ts` exposes a
  `TypedPocketBase` client via `pb()` (server-only, superuser-authed,
  process-lifetime cache, self-heals on 401/403).

## Ops runbook

- Read-only reconciliation: `python3 scripts/audit-cockpit-to-pb.py --files
  --output /private/tmp/emmaus-audit.json`. Requires the existing `.env`
  connection settings. Exit 2 means findings need review; exit 1 means the
  audit could not complete. The report contains record IDs and field names,
  not credential values. No writes or automatic restoration are performed.
  See `docs/migration-audit-2026-09-21.md` for the latest findings and limits.
- Import preflight validates generic collection payloads against the live PB
  schema. Collected write/download failures and unresolved references now
  result in a nonzero exit rather than a misleading `Done`. This is not a
  transaction: a failed import can already have written some records, so
  reconcile before retrying. Do not rerun cut-over phases to repair a subset.

- Local stack: `bun pb:local`, seed fixtures `bun pb:seed`, admin UI
  `bun pb:local:ui` (admin@emmaus.local / devpassword).
- Smoke tests (run against local): `bun pb:smoke`
  (`scripts/smoke-liturgy-repo-pb.ts` — covers every repo).
- Prod is normally reached directly at `https://db.emmaus.wien`. The explicit
  `bun pb:prod:tunnel` command bypasses the ingress for migrations and
  break-glass access; it dies when the PB pod restarts.
- Data sync from Cockpit: `scripts/migrate-cockpit-to-pb.ts`. `PHASES=...`
  is mandatory; all existing phases are marked cut-over and additionally
  require `I_KNOW_THIS_OVERWRITES_PB=1` because re-running them overwrites
  newer PB data with stale Cockpit state. Use only for restores or when
  migrating a genuinely new slice (sync minutes before the deploy flips the
  write path, never after).
- Backups: nightly CronJob (`emmaus-pb-backup`) uploads a PB backup zip to a
  GitHub release (`pb-backup-*`), keeps the newest 14. Restore procedure is
  documented at the top of `deploy/helm/templates/cronjob-pb-backup.yaml`.
- **Superuser password source of truth is the k8s secret `emmaus-secrets`**
  (`PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD`). The container entrypoint re-upserts
  the superuser on every pod start, so a mismatched password elsewhere gets
  clobbered. Vercel prod and local `.env` must hold the same values.

## Hard-won gotchas

- PB text fields silently apply a **5000-char max** when `max` is 0/unset —
  always set explicit `max` (see migration `1729500300_cache_text_limits.js`).
- PB returns dates as `"YYYY-MM-DD HH:mm:ss.sssZ"`; Cockpit-era consumers
  (e.g. `formatDate`) expect `"YYYY-MM-DD"` — adapters trim where needed.
- Next 16 cache-component prerendering forbids `Date.now()`/uncached IO
  ordering: never put clock reads in the `pb()` hot path, and wrap
  page-level data fetchers in `"use cache"` (see `getCurrentWeeklyData`).
- Never `getFullList` collections with large JSON blobs from page code —
  13 parallel build workers OOM-killed the PB pod (256Mi then; 512Mi now).
  Fetch single rows or use `fields:` projections (`fetchWeeklySpans`).
- Vercel deploys and Helm deploys both trigger on push to `main`; a schema
  migration and the code using it ship in the same push (Helm applies in
  ~1 min, before the Vercel build finishes).

## Content + files finale — what was done (2026-07-20)

- Schema: `deploy/helm/pb_migrations/1729500700_content.js` creates `sites`
  (flattened page tree: `parent` self-relation + `sort_order`), `articles`,
  `emmausbote`, `impressum` (single-row collection; was a Cockpit
  internal-data singleton) and `content_assets`. HTML lives in `editor`
  fields so parish editors get a WYSIWYG in the PB admin UI.
- Cockpit's nested `site` tree is flattened at import; the repo
  (`fetchSiteStructure`) rebuilds the tree and finds the root by
  `name = "emmaus.wien"`. The Cockpit `layout`
  (`{component:"text",settings:{text}}[]`, text-only in practice) was
  flattened into the single `html` field; `RenderCpLayout` is gone,
  everything renders through `RenderCpWysiwyg`.
- Data migration: `PHASES=content scripts/migrate-cockpit-to-pb.ts`
  downloads all binaries from Cockpit (article images, Emmausbote
  PDFs/previews, and every `/storage/uploads/...` /
  `data.emmaus.wien|data.eni.wien` reference found inside stored HTML),
  re-uploads them into PB file fields / `content_assets`, and rewrites the
  HTML to the PB file URLs. Idempotent (verified: re-run reports
  `unchanged` across the board). It needs `COCKPIT_HOST` set; asset URLs are
  baked using `PB_PUBLIC_URL` (defaults to `https://db.emmaus.wien` when
  targeting the 8091 prod tunnel, else `POCKETBASE_URL`).
- The Cockpit `article` collection (singular, 137 rows) had **no consumers
  anywhere in the app** and was intentionally not migrated.
- `bun pb:smoke` now covers the content repo too.

## Prod cutover (done 2026-07-20)

Schema applied via Helm, `PHASES=content` run against the prod tunnel
(20 sites / 144 articles / 25 issues / 1 impressum / 27 assets, zero
errors, re-run verified idempotent), and the live site verified: zero
`data.emmaus.wien` references left, images/PDFs serve from
`db.emmaus.wien/api/files/...`, preserved "Zuletzt geändert" dates intact.
The first Vercel build of the cutover push raced the data migration and
failed prerendering /artikel on an empty list — now guarded
(`app/artikel/page.tsx`). `"content"` is in `CUT_OVER`.

## Remaining work: Cockpit retirement

1. Delete `cockpit-client`, `util/cockpit.generated.ts` and
   `scripts/migrate-cockpit-to-pb.ts`'s Cockpit imports (moving the
   still-used `Cp*` types/enums — `CpWeeklyE`, `CpPerson`, `CpPaper*`,
   `CpLiturgy*`, competences enum — into the repos), plus the
   `generate` npm script.
2. Remove Cockpit env vars (`COCKPIT_HOST`, `COCKPIT_TOKEN`,
   `NEXT_PUBLIC_COCKPIT_HOST`) from Vercel and `.env`.
3. Shut down the Cockpit instance (after a final backup — it still holds
   the unmigrated `article` collection and pre-2023 assets).

## Editor UX for website content (decided)

Content was migrated as HTML into PB `editor` fields — parish editors use
the TinyMCE-based WYSIWYG in the PB admin dashboard (`db.emmaus.wien/_/`),
a like-for-like replacement for the Cockpit admin. Images/files can be
inserted via PB's file picker. If a nicer on-brand editor is ever wanted,
an in-app page (react-quill-new + the existing `Editor` competence) can be
added later without schema changes.
