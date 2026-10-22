/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * `papal_intentions` collection — monthly papal prayer intentions
 * ("Gebetsanliegen des Papstes") for the Monatsblatt flyer.
 *
 * There is no reliable public API for the German intentions, but the
 * Vatican publishes them about a year in advance. Workflow: once a year,
 * paste the 12 intentions into this collection via the PB admin UI
 * (key = "YYYY-MM"). The Monatsblatt editor loads the row matching the
 * issue's month.
 */
migrate(
  (app) => {
    const intentions = new Collection({
      type: "base",
      name: "papal_intentions",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "month", type: "text", required: true, max: 16 },
        { name: "title", type: "text", required: true, max: 300 },
        { name: "text", type: "text", required: true, max: 2000 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_papal_intentions_month ON papal_intentions (month)",
      ],
    });
    app.save(intentions);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("papal_intentions"));
    } catch (_) {
      // Collection may not exist.
    }
  },
);
