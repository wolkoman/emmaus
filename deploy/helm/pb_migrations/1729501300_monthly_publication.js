/// <reference path="../../../pb/pb_data/types.d.ts" />
/**
 * `monthlies`: publication result of an issue — the two rendered PDFs (folded
 * flyer and A3 poster) plus the timestamp they were generated at.
 *
 * Written by the editor's "Veröffentlichen" action (see
 * app/monatsblatt/editor/actions.ts) only after BOTH render jobs finished, so
 * the two links and `publishedAt` always describe the same generation run —
 * readers can never get a flyer from today next to last month's poster.
 *
 * Field names are camelCase (unlike `articles.published_at`) because
 * MonthlyRecord is read straight off the PB record without a mapper, see
 * app/(domain)/monthly/monthly-repo.ts.
 */
migrate(
  (app) => {
    const monthlies = app.findCollectionByNameOrId("monthlies");
    monthlies.fields.add(new TextField({ name: "flyerPdfUrl", max: 500 }));
    monthlies.fields.add(new TextField({ name: "posterPdfUrl", max: 500 }));
    monthlies.fields.add(new DateField({ name: "publishedAt" }));
    app.save(monthlies);
  },
  (app) => {
    const monthlies = app.findCollectionByNameOrId("monthlies");
    for (const name of ["flyerPdfUrl", "posterPdfUrl", "publishedAt"]) {
      monthlies.fields.removeByName(name);
    }
    app.save(monthlies);
  },
);
