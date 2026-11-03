/// <reference path="../../../pb/pb_data/types.d.ts" />
/** `mail:wahl`: read and send as wahl@emmaus.wien (/postfach/wahl). */
migrate(
  (app) => {
    const persons = app.findCollectionByNameOrId("persons");
    const field = persons.fields.getByName("competences");
    field.values = [...field.values, "mail:wahl"];
    field.maxSelect = field.values.length;
    app.save(persons);
  },
  (app) => {
    const persons = app.findCollectionByNameOrId("persons");
    const field = persons.fields.getByName("competences");
    field.values = field.values.filter((value) => value !== "mail:wahl");
    field.maxSelect = field.values.length;
    app.save(persons);
  },
);
