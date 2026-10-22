/// <reference path="../../../pb/pb_data/types.d.ts" />
// The app reads PB only server-side as superuser; public rules exposed persons' login codes.
const PUBLIC_READ = [
  "persons",
  "liturgies",
  "liturgy_events",
  "liturgy_rosters",
  "cache",
];

migrate(
  (app) => {
    for (const name of PUBLIC_READ) {
      const collection = app.findCollectionByNameOrId(name);
      collection.listRule = null;
      collection.viewRule = null;
      app.save(collection);
    }
    const users = app.findCollectionByNameOrId("users");
    users.createRule = null;
    app.save(users);
  },
  (app) => {
    for (const name of PUBLIC_READ) {
      const collection = app.findCollectionByNameOrId(name);
      collection.listRule = "";
      collection.viewRule = "";
      app.save(collection);
    }
    const users = app.findCollectionByNameOrId("users");
    users.createRule = "";
    app.save(users);
  },
);
