/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Reshape the `liturgies` collection to allow multiple rows per date.
 *
 * In Cockpit, `liturgy` is a singleton keyed by date ("YYYY-MM-DD") whose
 * value is an array of liturgy variants (usually 1, sometimes more for
 * vigil + main feast). The initial migration modeled `key` as unique, which
 * doesn't fit.
 *
 * This migration:
 *   - drops the unique index on `key`
 *   - adds a `position` integer field (0-based index within a date)
 *   - adds a composite unique index on `(key, position)` so re-running the
 *     data migration is idempotent
 *   - backfills `position = 0` for any existing rows (none in prod at the
 *     time of writing, but makes the migration safe to run anywhere)
 */
migrate(
  (app) => {
    const liturgies = app.findCollectionByNameOrId("liturgies");

    // Add `position` field if missing.
    if (!liturgies.fields.getByName("position")) {
      liturgies.fields.add(
        new NumberField({
          name: "position",
          required: false,
          onlyInt: true,
          min: 0,
        }),
      );
    }

    // Swap the unique index on (key) for a composite unique index on (key, position).
    liturgies.indexes = [
      "CREATE UNIQUE INDEX idx_liturgies_key_position ON liturgies (key, position)",
    ];

    app.save(liturgies);

    // Backfill position=0 for any pre-existing rows without it.
    const rows = app.findAllRecords("liturgies");
    for (const row of rows) {
      if (row.get("position") === undefined || row.get("position") === null) {
        row.set("position", 0);
        app.save(row);
      }
    }
  },
  (app) => {
    // Down: revert the shape.
    const liturgies = app.findCollectionByNameOrId("liturgies");
    const positionField = liturgies.fields.getByName("position");
    if (positionField) {
      liturgies.fields.removeById(positionField.id);
    }
    liturgies.indexes = [
      "CREATE UNIQUE INDEX idx_liturgies_key ON liturgies (key)",
    ];
    app.save(liturgies);
  },
);
