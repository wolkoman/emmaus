/// <reference path="../../../pb/pb_data/types.d.ts" />
/**
 * `monthlies.newsletterSentAt` — when the issue went out to the newsletter
 * recipients (the same `newsletter` collection the Wochenblatt uses).
 *
 * Serves the same purpose as `weeklies.sent`: the send action refuses to run
 * twice. It is a timestamp rather than a flag so the editor can show WHEN it
 * went out, and it is stamped BEFORE the mail is handed to the SMTP server —
 * a crash mid-send must never lead to a second delivery to the whole list.
 */
migrate(
  (app) => {
    const monthlies = app.findCollectionByNameOrId("monthlies");
    monthlies.fields.add(new DateField({ name: "newsletterSentAt" }));
    app.save(monthlies);
  },
  (app) => {
    const monthlies = app.findCollectionByNameOrId("monthlies");
    monthlies.fields.removeByName("newsletterSentAt");
    app.save(monthlies);
  },
);
