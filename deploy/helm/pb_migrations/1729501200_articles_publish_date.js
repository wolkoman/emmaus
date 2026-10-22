/// <reference path="../../../pb/pb_data/types.d.ts" />
/**
 * Make `articles.created` the single publication date and drop the Cockpit-era
 * columns (`published_at`, `cockpit_created`, `cockpit_modified`, `cockpit_id`).
 *
 * Why: the publication date used to live in `published_at`, a free-text field
 * hand-typed in the admin UI. A single article entered as "03.08.2026" instead
 * of "2026-08-03" sorted below every "20xx-.." value (the feed sorted by it
 * lexicographically) and silently vanished from the site. `cockpit_created`
 * wasn't a usable substitute either: a Cockpit-side bulk operation set it to
 * 2025-03-17 on 121 of the 145 articles, so it carries no real date for most of
 * the archive.
 *
 * Afterwards there is exactly one timestamp, set automatically by PB when the
 * record is created, and no date for anyone to mistype.
 *
 * Backfill rules, per record:
 *   - `cockpit_created` empty  -> created natively in PB, `created` is already
 *                                 correct, leave it untouched.
 *   - day(`cockpit_created`) == `published_at` -> the two corroborate each
 *                                 other, so use `cockpit_created` and keep its
 *                                 time-of-day (better intra-day ordering).
 *   - otherwise                -> `cockpit_created` is the bulk-stamped value;
 *                                 use `published_at` at midnight.
 *
 * `created` is a system autodate and can't be set through the record API, so it
 * is written with raw SQL.
 *
 * IRREVERSIBLE: the original import timestamps are overwritten and the dropped
 * ids/dates are not recoverable. The down migration restores the columns and
 * re-derives `published_at` from `created`, but cannot restore `cockpit_id`
 * (which also means the Cockpit importer can no longer match articles \u2014 its
 * articles phase was removed alongside this). Take a PB backup first.
 *
 * `title_slug` is deliberately kept: it is no longer part of any URL, but it is
 * the lookup table that redirects the 139 legacy `/artikel/<title-slug>` links
 * to their canonical `/artikel/<id>/<slug>` URL.
 */

const CLEANUP_FIELDS = [
  "published_at",
  "cockpit_created",
  "cockpit_modified",
  "cockpit_id",
];

/** PB stores datetimes as "2026-06-29 12:26:04.000Z". */
function toPbDateTime(date) {
  return date.toISOString().replace("T", " ");
}

/** Accepts ISO "2026-08-03" and the one German-format "03.08.2026" value. */
function toIsoDay(raw) {
  const value = (raw || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const german = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (german) return `${german[3]}-${german[2]}-${german[1]}`;
  return null;
}

migrate(
  (app) => {
    const articles = app.findCollectionByNameOrId("articles");

    let fromCockpitCreated = 0;
    let fromPublishedAt = 0;
    let keptNative = 0;
    const unparsed = [];

    for (const record of app.findAllRecords("articles")) {
      if (!record) continue;

      const publishedDay = toIsoDay(record.getString("published_at"));
      const cockpitCreated = record.getInt("cockpit_created");

      if (!cockpitCreated) {
        // Created in PB: `created` is already the real thing.
        keptNative++;
        continue;
      }

      if (!publishedDay) {
        unparsed.push(`${record.id} (${record.getString("published_at")})`);
        continue;
      }

      const cockpitDate = new Date(cockpitCreated * 1000);
      const corroborates =
        cockpitDate.toISOString().slice(0, 10) === publishedDay;
      const created = corroborates
        ? toPbDateTime(cockpitDate)
        : `${publishedDay} 00:00:00.000Z`;

      app
        .db()
        .newQuery("UPDATE articles SET created = {:created} WHERE id = {:id}")
        .bind({ created, id: record.id })
        .execute();

      corroborates ? fromCockpitCreated++ : fromPublishedAt++;
    }

    console.log(
      `articles.created backfilled: ${fromCockpitCreated} from cockpit_created, ` +
        `${fromPublishedAt} from published_at, ${keptNative} already native` +
        (unparsed.length
          ? `, ${unparsed.length} left untouched (unparsable published_at: ${unparsed.join(", ")})`
          : ""),
    );

    for (const name of CLEANUP_FIELDS) {
      articles.fields.removeByName(name);
    }

    // `indexes` is a Go-backed JSONArray, so build a plain JS array rather than
    // relying on Array.prototype methods being present on the proxy.
    const keptIndexes = [];
    for (const index of articles.indexes) {
      if (index.indexOf("idx_articles_cockpit_id") === -1) {
        keptIndexes.push(index);
      }
    }
    articles.indexes = keptIndexes;

    app.save(articles);
  },
  (app) => {
    const articles = app.findCollectionByNameOrId("articles");

    articles.fields.add(new TextField({ name: "cockpit_id", max: 64 }));
    articles.fields.add(new TextField({ name: "published_at", max: 64 }));
    articles.fields.add(
      new NumberField({ name: "cockpit_created", onlyInt: true }),
    );
    articles.fields.add(
      new NumberField({ name: "cockpit_modified", onlyInt: true }),
    );
    const restoredIndexes = [];
    for (const index of articles.indexes) {
      restoredIndexes.push(index);
    }
    restoredIndexes.push(
      "CREATE UNIQUE INDEX idx_articles_cockpit_id ON articles (cockpit_id) WHERE cockpit_id != ''",
    );
    articles.indexes = restoredIndexes;

    app.save(articles);

    // Best effort: `published_at` is re-derived from `created` so ordering keeps
    // working. `cockpit_id` / `cockpit_created` are gone for good.
    for (const record of app.findAllRecords("articles")) {
      if (!record) continue;
      try {
        record.set("published_at", record.getString("created").slice(0, 10));
        app.save(record);
      } catch (_) {
        // A single unparsable row must not block the rollback.
      }
    }
  },
);
