/// <reference path="../../../pb/pb_data/types.d.ts" />
/** `mail:events`: read and send as events@emmaus.wien (/postfach/events). */
migrate(
  (app) => {
    const persons = app.findCollectionByNameOrId("persons");
    const field = persons.fields.getByName("competences");
    field.values = [...field.values, "mail:events"];
    field.maxSelect = field.values.length;
    app.save(persons);
  },
  (app) => {
    const persons = app.findCollectionByNameOrId("persons");
    const field = persons.fields.getByName("competences");
    field.values = field.values.filter((value) => value !== "mail:events");
    field.maxSelect = field.values.length;
    app.save(persons);
  },
);
