/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * `monthlies` collection — Monatsmitteilungen (folded A4 flyer, 6 panels).
 * Analog to `weeklies`: `data` holds the whole MonthlyEditorStore blob
 * (tiles + events). `month` is "YYYY-MM" for sorting; `name` is the unique
 * human-readable title ("August 2026") used as the load/print key.
 */
migrate(
  (app) => {
    const monthlies = new Collection({
      type: "base",
      name: "monthlies",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "name", type: "text", required: true, max: 300 },
        { name: "month", type: "text", max: 16 },
        { name: "data", type: "json", maxSize: 5000000 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_monthlies_name ON monthlies (name)",
        "CREATE INDEX idx_monthlies_month ON monthlies (month)",
      ],
    });
    app.save(monthlies);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("monthlies"));
    } catch (_) {
      // Collection may not exist.
    }
  },
);
