/// <reference path="../../../pb/pb_data/types.d.ts" />
migrate(
  (app) => {
    const persons = app.findCollectionByNameOrId("persons");

    const resets = new Collection({
      type: "base",
      name: "password_resets",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: "person",
          type: "relation",
          collectionId: persons.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        // sha256 of the emailed token; the token itself is never stored.
        { name: "token_hash", type: "text", required: true, max: 64 },
        { name: "expires", type: "date", required: true },
        { name: "used", type: "date" },
        { name: "created", type: "autodate", onCreate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_password_resets_token ON password_resets (token_hash)",
      ],
    });
    app.save(resets);

    const passkeys = new Collection({
      type: "base",
      name: "passkeys",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: "person",
          type: "relation",
          collectionId: persons.id,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: "credential_id", type: "text", required: true, max: 1024 },
        { name: "public_key", type: "text", required: true, max: 4096 },
        { name: "counter", type: "number" },
        { name: "transports", type: "json" },
        { name: "name", type: "text", max: 100 },
        { name: "last_used", type: "date" },
        { name: "created", type: "autodate", onCreate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_passkeys_credential ON passkeys (credential_id)",
      ],
    });
    app.save(passkeys);
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("passkeys"));
    app.delete(app.findCollectionByNameOrId("password_resets"));
  },
);
