/// <reference path="../../../pb/pb_data/types.d.ts" />
const COMPETENCES = [
  "calendar",
  "instagram",
  "calendar_administration",
  "editor",
  "weekly_editor",
  "reader",
  "communion_minister",
  "sacristan",
  "musician",
  "reader_planning",
  "communion_minister_planning",
  "sacristan_planning",
  "musician_planning",
];

// PocketBase can't change a field's type in place: add the new field, copy, swap.
function convert(app, makeField) {
  const persons = app.findCollectionByNameOrId("persons");
  persons.fields.add(makeField("competences_tmp"));
  app.save(persons);

  for (const record of app.findAllRecords("persons")) {
    record.set("competences_tmp", record.get("competences") || []);
    app.unsafeWithoutHooks().save(record);
  }

  persons.fields.removeByName("competences");
  persons.fields.getByName("competences_tmp").name = "competences";
  app.save(persons);
}

migrate(
  (app) =>
    convert(
      app,
      (name) =>
        new SelectField({
          name,
          maxSelect: COMPETENCES.length,
          values: COMPETENCES,
        }),
    ),
  (app) => convert(app, (name) => new JSONField({ name, maxSize: 4096 })),
);
