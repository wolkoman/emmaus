/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * `weeklies` collection — Wochenmitteilungen (migrated from Cockpit's
 * `weekly_e`). `data` holds the whole WeeklyEditorStore blob (tiles, html,
 * events), hence the generous maxSize.
 *
 * `start`/`end` stay plain "YYYY-MM-DD" text — consumers compare them
 * lexicographically and format them directly.
 *
 * `created`/`updated` autodate fields back the Cockpit-era `_created` /
 * `_modified` numbers (getCurrentWeeklyData sorts by `_modified`).
 */
migrate(
  (app) => {
    const weeklies = new Collection({
      type: "base",
      name: "weeklies",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "name", type: "text", required: true, max: 300 },
        { name: "start", type: "text", max: 32 },
        { name: "end", type: "text", max: 32 },
        { name: "data", type: "json", maxSize: 5000000 },
        { name: "sent", type: "bool" },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_weeklies_cockpit_id ON weeklies (cockpit_id) WHERE cockpit_id != ''",
        "CREATE UNIQUE INDEX idx_weeklies_name ON weeklies (name)",
        "CREATE INDEX idx_weeklies_start ON weeklies (start)",
      ],
    });
    app.save(weeklies);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("weeklies"));
    } catch (_) {
      // Collection may not exist.
    }
  },
);
