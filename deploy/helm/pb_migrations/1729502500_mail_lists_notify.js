/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/** `mail_lists.notify`: addresses that get the daily digest of open mails. */
migrate(
  (app) => {
    const lists = app.findCollectionByNameOrId("mail_lists");
    lists.fields.add(new JSONField({ name: "notify", maxSize: 20000 }));
    app.save(lists);
  },
  (app) => {
    const lists = app.findCollectionByNameOrId("mail_lists");
    lists.fields.removeByName("notify");
    app.save(lists);
  },
);
