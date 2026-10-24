/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * `mail_lists`: one free-text list per mailbox (/postfach/<mailbox>/liste),
 * edited by hand and updated by Claude from received mails. `history` keeps
 * the last automatic changes: [{ at, uid, subject, from, change }].
 */
migrate(
  (app) => {
    const lists = new Collection({
      type: "base",
      name: "mail_lists",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "mailbox", type: "text", required: true, max: 100 },
        { name: "text", type: "text", max: 200000 },
        { name: "instructions", type: "text", max: 10000 },
        { name: "history", type: "json", maxSize: 200000 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_mail_lists_mailbox ON mail_lists (mailbox)",
      ],
    });
    app.save(lists);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("mail_lists"));
    } catch (_) {
      // Collection may not exist.
    }
  },
);
