/// <reference path="../../../pb/pb_data/types.d.ts" />
/**
 * `monthlies`: rendered PDF of the optional Einlage (a loose leaf printed
 * three times per A4 sheet, see app/monatsblatt/fold.ts). Written together
 * with the other publication fields; empty for issues without an Einlage.
 */
migrate(
  (app) => {
    const monthlies = app.findCollectionByNameOrId("monthlies");
    monthlies.fields.add(new TextField({ name: "insertPdfUrl", max: 500 }));
    app.save(monthlies);
  },
  (app) => {
    const monthlies = app.findCollectionByNameOrId("monthlies");
    monthlies.fields.removeByName("insertPdfUrl");
    app.save(monthlies);
  },
);
