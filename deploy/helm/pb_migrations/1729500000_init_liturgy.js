/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Initial schema for the liturgy-roster feature.
 *
 * Four collections:
 *   - persons           — people who can be assigned to liturgical roles
 *   - liturgies         — lookup of liturgy metadata (readings, color, rank) per key
 *   - liturgy_events    — an instance of a liturgy on a given calendar event/date
 *   - liturgy_rosters   — assignment of a person to a position in a liturgy event
 *
 * The `cockpit_id` field on each collection tracks the original Cockpit _id
 * so the migration script can be run idempotently.
 */
migrate(
  (app) => {
    // ---- persons ----
    const persons = new Collection({
      type: "base",
      name: "persons",
      listRule: "",
      viewRule: "",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "name", type: "text", required: true, max: 200 },
        { name: "email", type: "email" },
        { name: "username", type: "text", max: 200 },
        { name: "code", type: "text", max: 200 },
        { name: "active", type: "bool" },
        { name: "last_login", type: "date" },
        // Competences are a free-form list of enum values originating in Cockpit.
        // We store them as a JSON array (max 16 entries) rather than a select
        // field so that adding new competence types doesn't require a migration.
        { name: "competences", type: "json", maxSize: 4096 },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_persons_cockpit_id ON persons (cockpit_id) WHERE cockpit_id != ''",
        "CREATE INDEX idx_persons_active ON persons (active)",
      ],
    });
    app.save(persons);

    // ---- liturgies ----
    const liturgies = new Collection({
      type: "base",
      name: "liturgies",
      listRule: "",
      viewRule: "",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "key", type: "text", required: true, max: 200 },
        { name: "name", type: "text", max: 200 },
        { name: "rank", type: "text", max: 200 },
        { name: "color", type: "text", max: 64 },
        { name: "reading1", type: "text", max: 500 },
        { name: "reading2", type: "text", max: 500 },
        { name: "psalm", type: "text", max: 500 },
        { name: "evangelium", type: "text", max: 500 },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_liturgies_key ON liturgies (key)",
      ],
    });
    app.save(liturgies);

    // ---- liturgy_events ----
    const liturgyEvents = new Collection({
      type: "base",
      name: "liturgy_events",
      listRule: "",
      viewRule: "",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        {
          name: "calendar_event_id",
          type: "text",
          max: 64,
          // Calendar events live in Cockpit for now; we store their id as a string.
        },
        { name: "date", type: "date", required: true },
        { name: "liturgy_name", type: "text", max: 200 },
        // Free-form list of cancelled position keys (e.g. ["READER1", "MUSICIAN"]).
        { name: "cancellations", type: "json", maxSize: 2048 },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_liturgy_events_cockpit_id ON liturgy_events (cockpit_id) WHERE cockpit_id != ''",
        "CREATE INDEX idx_liturgy_events_date ON liturgy_events (date)",
        "CREATE INDEX idx_liturgy_events_calendar_event_id ON liturgy_events (calendar_event_id)",
      ],
    });
    app.save(liturgyEvents);

    // ---- liturgy_rosters ----
    // Look up the collection IDs we just created so we can reference them.
    const personsCol = app.findCollectionByNameOrId("persons");
    const liturgyEventsCol = app.findCollectionByNameOrId("liturgy_events");

    const liturgyRosters = new Collection({
      type: "base",
      name: "liturgy_rosters",
      listRule: "",
      viewRule: "",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        {
          name: "liturgy_event",
          type: "relation",
          required: true,
          collectionId: liturgyEventsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: "person",
          type: "relation",
          collectionId: personsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        // person_name is duplicated from persons.name at assignment time so the
        // roster history stays meaningful even if a person is renamed later.
        { name: "person_name", type: "text", max: 200 },
        {
          name: "position",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["READER1", "READER2", "MUSICIAN", "SACRISTAN"],
        },
        {
          name: "status",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["assigned", "informed", "cancelled"],
        },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_liturgy_rosters_cockpit_id ON liturgy_rosters (cockpit_id) WHERE cockpit_id != ''",
        "CREATE UNIQUE INDEX idx_liturgy_rosters_event_position ON liturgy_rosters (liturgy_event, position)",
      ],
    });
    app.save(liturgyRosters);
  },
  (app) => {
    // Down migration: drop in reverse dependency order.
    for (const name of ["liturgy_rosters", "liturgy_events", "liturgies", "persons"]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        // Silent: collection may not exist if an earlier drop failed.
      }
    }
  },
);
