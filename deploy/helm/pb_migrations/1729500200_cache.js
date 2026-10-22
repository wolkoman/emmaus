/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * `cache` collection — generic key/value cache (currently used for ChatGPT
 * prompt->completion caching, migrated from the Cockpit `cache` collection).
 *
 * Keys are full prompts (can be several KB), so no max length is set.
 * `cockpit_id` tracks the original Cockpit _id for idempotent data migration.
 */
migrate(
  (app) => {
    const cache = new Collection({
      type: "base",
      name: "cache",
      listRule: "",
      viewRule: "",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "key", type: "text", required: true, max: 0 },
        { name: "value", type: "text", max: 0 },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_cache_key ON cache (key)"],
    });
    app.save(cache);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("cache"));
    } catch (_) {
      // Collection may not exist.
    }
  },
);
