/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Issues now live on `paper_projects` (published, pdf, cover). The down
 * migration only restores the empty schema; the records come from a backup.
 */
migrate(
  (app) => {
    app.delete(app.findCollectionByNameOrId("emmausbote"));
  },
  (app) => {
    app.save(
      new Collection({
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
          {
            name: "updated",
            type: "autodate",
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_emmausbote_cockpit_id ON emmausbote (cockpit_id) WHERE cockpit_id != ''",
        ],
      }),
    );
  },
);
