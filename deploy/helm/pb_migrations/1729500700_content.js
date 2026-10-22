/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Public website content collections (migrated from Cockpit — the final
 * slice, "content + files finale"):
 *   - sites          — the page tree rendered under /[slug] (flattened from
 *                      Cockpit's nested `site` tree; `parent` self-relation +
 *                      `sort_order` preserve the hierarchy)
 *   - articles       — news articles ("Beiträge") with a preview image file
 *   - emmausbote     — one row per parish-paper issue (PDF + preview image)
 *   - impressum      — single-row collection (was a Cockpit internal-data
 *                      singleton)
 *   - content_assets — files that were referenced from inside stored HTML
 *                      (Cockpit /storage/uploads/...); HTML is rewritten to
 *                      point at these PB files during data migration
 *
 * HTML lives in `editor` fields so parish editors keep a WYSIWYG in the PB
 * admin UI (like-for-like replacement for the Cockpit admin).
 *
 * Cockpit's original `_created`/`_modified` are shown on the public site
 * (article dates, "Zuletzt geändert"), and PB autodate fields get reset at
 * import time — so the import stores them in `cockpit_created` /
 * `cockpit_modified` (epoch seconds) and the repo prefers those until a
 * record is actually edited in PB (`updated != created`).
 */
migrate(
  (app) => {
    const sites = new Collection({
      type: "base",
      name: "sites",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "name", type: "text", required: true, max: 300 },
        { name: "slug", type: "text", max: 300 },
        { name: "title", type: "text", max: 500 },
        { name: "summary", type: "text", max: 2000 },
        { name: "icon", type: "text", max: 100 },
        { name: "html", type: "editor", maxSize: 1000000 },
        { name: "sort_order", type: "number", onlyInt: true },
        { name: "cockpit_created", type: "number", onlyInt: true },
        { name: "cockpit_modified", type: "number", onlyInt: true },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_sites_cockpit_id ON sites (cockpit_id) WHERE cockpit_id != ''",
        "CREATE INDEX idx_sites_slug ON sites (slug)",
      ],
    });
    app.save(sites);

    // Self-relation must be added after the collection exists (needs its id).
    const sitesCol = app.findCollectionByNameOrId("sites");
    sitesCol.fields.add(
      new RelationField({
        name: "parent",
        collectionId: sitesCol.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    );
    app.save(sitesCol);

    const articles = new Collection({
      type: "base",
      name: "articles",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "title", type: "text", required: true, max: 500 },
        { name: "title_slug", type: "text", max: 500 },
        { name: "author", type: "text", max: 300 },
        { name: "content", type: "editor", maxSize: 1000000 },
        { name: "image", type: "file", maxSelect: 1, maxSize: 52428800 },
        { name: "public", type: "bool" },
        { name: "published_at", type: "text", max: 64 },
        { name: "cockpit_created", type: "number", onlyInt: true },
        { name: "cockpit_modified", type: "number", onlyInt: true },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_articles_cockpit_id ON articles (cockpit_id) WHERE cockpit_id != ''",
        "CREATE INDEX idx_articles_title_slug ON articles (title_slug)",
      ],
    });
    app.save(articles);

    const emmausbote = new Collection({
      type: "base",
      name: "emmausbote",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "date", type: "text", required: true, max: 32 },
        { name: "file", type: "file", maxSelect: 1, maxSize: 104857600 },
        { name: "preview", type: "file", maxSelect: 1, maxSize: 52428800 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_emmausbote_cockpit_id ON emmausbote (cockpit_id) WHERE cockpit_id != ''",
      ],
    });
    app.save(emmausbote);

    const impressum = new Collection({
      type: "base",
      name: "impressum",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "title", type: "text", max: 300 },
        { name: "content", type: "editor", maxSize: 1000000 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_impressum_cockpit_id ON impressum (cockpit_id) WHERE cockpit_id != ''",
      ],
    });
    app.save(impressum);

    const assets = new Collection({
      type: "base",
      name: "content_assets",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        // Original Cockpit storage path (e.g. "storage/uploads/2020/..."),
        // used as the idempotency key by the data migration.
        { name: "cockpit_path", type: "text", required: true, max: 1000 },
        { name: "file", type: "file", maxSelect: 1, maxSize: 104857600 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_content_assets_path ON content_assets (cockpit_path)",
      ],
    });
    app.save(assets);
  },
  (app) => {
    for (const name of [
      "content_assets",
      "impressum",
      "emmausbote",
      "articles",
      "sites",
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        // Collection may not exist.
      }
    }
  },
);
