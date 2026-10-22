/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Projects are addressed by their PB id; old Cockpit-id project links break
 * on purpose. Article and text ids keep their `cockpit_id`.
 */
migrate(
  (app) => {
    const projects = app.findCollectionByNameOrId("paper_projects");
    projects.removeIndex("idx_paper_projects_cockpit_id");
    projects.fields.removeByName("cockpit_id");
    app.save(projects);
  },
  (app) => {
    const projects = app.findCollectionByNameOrId("paper_projects");
    projects.fields.add(new TextField({ name: "cockpit_id", max: 64 }));
    projects.addIndex(
      "idx_paper_projects_cockpit_id",
      true,
      "cockpit_id",
      "cockpit_id != ''",
    );
    app.save(projects);
  },
);
