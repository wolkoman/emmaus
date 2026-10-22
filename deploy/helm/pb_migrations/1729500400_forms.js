/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Form-driven collections migrated from Cockpit:
 *   - reservations        — Raumvergabe requests + two-step approval flow
 *   - newsletter          — Wochenmitteilungen subscriptions (double opt-in)
 *   - shared_links        — expiring photo-share links (resourcen)
 *   - alpha_registrations — Alpha course sign-ups
 *
 * JSON fields keep the exact Cockpit shapes ({value}[] wrappers) so app code
 * doesn't need to remap. `cockpit_id` enables idempotent data migration; for
 * shared_links it also keeps old share URLs (which embed the Cockpit id)
 * resolvable.
 *
 * NB: text fields get explicit `max` values — PB silently applies a
 * 5000-char default when max is 0/unset.
 */
migrate(
  (app) => {
    const reservations = new Collection({
      type: "base",
      name: "reservations",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "occasion", type: "text", max: 2000 },
        // [{ value: { start, end } }]
        { name: "times", type: "json", maxSize: 16384 },
        { name: "contact_name", type: "text", max: 300 },
        { name: "contact_phone", type: "text", max: 100 },
        { name: "contact_relation", type: "text", max: 500 },
        { name: "contact_mail", type: "text", max: 300 },
        // [{ value: string }]
        { name: "rooms", type: "json", maxSize: 8192 },
        { name: "access", type: "bool" },
        { name: "access_via", type: "text", max: 500 },
        { name: "approved_sitemanager", type: "text", max: 300 },
        { name: "approved_sitemanager_at", type: "bool" },
        { name: "sitemanager_secret", type: "text", max: 200 },
        { name: "approved_reverend", type: "text", max: 300 },
        { name: "approved_reverend_at", type: "bool" },
        { name: "reverend_secret", type: "text", max: 200 },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_reservations_cockpit_id ON reservations (cockpit_id) WHERE cockpit_id != ''",
        "CREATE INDEX idx_reservations_sm_secret ON reservations (sitemanager_secret)",
        "CREATE INDEX idx_reservations_rev_secret ON reservations (reverend_secret)",
      ],
    });
    app.save(reservations);

    const newsletter = new Collection({
      type: "base",
      name: "newsletter",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "mail", type: "text", required: true, max: 300 },
        { name: "token", type: "text", max: 200 },
        { name: "active", type: "bool" },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_newsletter_cockpit_id ON newsletter (cockpit_id) WHERE cockpit_id != ''",
        "CREATE UNIQUE INDEX idx_newsletter_mail ON newsletter (mail)",
        "CREATE INDEX idx_newsletter_token ON newsletter (token)",
      ],
    });
    app.save(newsletter);

    const sharedLinks = new Collection({
      type: "base",
      name: "shared_links",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "expiration", type: "date" },
        { name: "folder", type: "text", max: 500 },
        // [{ value: string }]
        { name: "ids", type: "json", maxSize: 65536 },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_shared_links_cockpit_id ON shared_links (cockpit_id) WHERE cockpit_id != ''",
      ],
    });
    app.save(sharedLinks);

    const alphaRegistrations = new Collection({
      type: "base",
      name: "alpha_registrations",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "name", type: "text", max: 300 },
        { name: "phone", type: "text", max: 100 },
        { name: "mail", type: "text", max: 300 },
        { name: "postal", type: "text", max: 100 },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_alpha_registrations_cockpit_id ON alpha_registrations (cockpit_id) WHERE cockpit_id != ''",
      ],
    });
    app.save(alphaRegistrations);
  },
  (app) => {
    for (const name of [
      "alpha_registrations",
      "shared_links",
      "newsletter",
      "reservations",
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        // Collection may not exist.
      }
    }
  },
);
