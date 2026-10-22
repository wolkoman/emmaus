/// <reference path="../../../pb/pb_data/types.d.ts" />
migrate(
  (app) => {
    const rosters = app.findCollectionByNameOrId("liturgy_rosters");
    rosters.fields.add(new DateField({ name: "reminder_sent" }));
    app.save(rosters);

    const persons = app.findCollectionByNameOrId("persons");
    persons.fields.add(new BoolField({ name: "liturgy_reminders_disabled" }));
    app.save(persons);
  },
  (app) => {
    const rosters = app.findCollectionByNameOrId("liturgy_rosters");
    rosters.fields.removeByName("reminder_sent");
    app.save(rosters);

    const persons = app.findCollectionByNameOrId("persons");
    persons.fields.removeByName("liturgy_reminders_disabled");
    app.save(persons);
  },
);
