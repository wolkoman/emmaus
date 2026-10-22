/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Published issues live on their paper project: publication date, the web PDF
 * and its cover image. Replaces the separate `emmausbote` collection.
 */
migrate(
  (app) => {
    const projects = app.findCollectionByNameOrId("paper_projects");
    projects.fields.add(new TextField({ name: "published", max: 32 }));
    projects.fields.add(
      new FileField({
        name: "pdf",
        maxSelect: 1,
        maxSize: 104857600,
        mimeTypes: ["application/pdf"],
      }),
    );
    projects.fields.add(
      new FileField({
        name: "cover",
        maxSelect: 1,
        maxSize: 52428800,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      }),
    );
    app.save(projects);
  },
  (app) => {
    const projects = app.findCollectionByNameOrId("paper_projects");
    for (const name of ["published", "pdf", "cover"]) {
      projects.fields.removeByName(name);
    }
    app.save(projects);
  },
);
