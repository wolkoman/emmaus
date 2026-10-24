/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * `mail_list_changes`: one record per received mail run through the list
 * update (`change` empty when the list stayed the same). `list_after` is the
 * whole list after that mail, to trace or undo a wrong automatic edit.
 */
migrate(
  (app) => {
    const changes = new Collection({
      type: "base",
      name: "mail_list_changes",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "mailbox", type: "text", required: true, max: 100 },
        { name: "uid", type: "number", required: true, onlyInt: true },
        { name: "subject", type: "text", max: 1000 },
        { name: "from", type: "text", max: 1000 },
        { name: "change", type: "text", max: 5000 },
        { name: "list_after", type: "text", max: 200000 },
        { name: "created", type: "autodate", onCreate: true },
      ],
      indexes: [
        "CREATE INDEX idx_mail_list_changes_mailbox_uid ON mail_list_changes (mailbox, uid)",
      ],
    });
    app.save(changes);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("mail_list_changes"));
    } catch (_) {
      // Collection may not exist.
    }
  },
);
