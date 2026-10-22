/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Redaktion / Emmausbote editorial collections (migrated from Cockpit):
 *   - paper_projects — an issue of the parish paper (deadline, print release)
 *   - paper_articles — articles within a project (status workflow, format)
 *   - paper_texts    — versioned editor content per article
 *   - paper_stats    — daily status counts per project (cron)
 *
 * `created`/`updated` autodate fields back the Cockpit `_created`/`_modified`
 * numbers used for sorting and the editor's version counter.
 */
migrate(
  (app) => {
    const projects = new Collection({
      type: "base",
      name: "paper_projects",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "name", type: "text", required: true, max: 300 },
        { name: "deadline", type: "text", max: 64 },
        { name: "printrelease", type: "text", max: 64 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_paper_projects_cockpit_id ON paper_projects (cockpit_id) WHERE cockpit_id != ''",
      ],
    });
    app.save(projects);

    const projectsCol = app.findCollectionByNameOrId("paper_projects");

    const articles = new Collection({
      type: "base",
      name: "paper_articles",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        { name: "name", type: "text", required: true, max: 500 },
        {
          name: "project",
          type: "relation",
          required: true,
          collectionId: projectsCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["writing", "written", "corrected", "finished"],
        },
        { name: "author", type: "text", max: 300 },
        {
          name: "format",
          type: "select",
          maxSelect: 1,
          values: [
            "C2200x3000x3/4",
            "C2600x3600x1",
            "C1300x1800x1/2",
            "C100x2000x~",
            "C3600x5400x2",
            "C5400x7200x3",
            "C800x1000x1/3",
          ],
        },
        { name: "char_min", type: "number", onlyInt: true },
        { name: "char_max", type: "number", onlyInt: true },
        { name: "gid", type: "text", max: 200 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_paper_articles_cockpit_id ON paper_articles (cockpit_id) WHERE cockpit_id != ''",
        "CREATE INDEX idx_paper_articles_project ON paper_articles (project)",
      ],
    });
    app.save(articles);

    const articlesCol = app.findCollectionByNameOrId("paper_articles");

    const texts = new Collection({
      type: "base",
      name: "paper_texts",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        {
          name: "article",
          type: "relation",
          required: true,
          collectionId: articlesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: "text", type: "text", max: 500000 },
        { name: "datetime", type: "text", max: 64 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_paper_texts_cockpit_id ON paper_texts (cockpit_id) WHERE cockpit_id != ''",
        "CREATE INDEX idx_paper_texts_article ON paper_texts (article)",
      ],
    });
    app.save(texts);

    const stats = new Collection({
      type: "base",
      name: "paper_stats",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "cockpit_id", type: "text", max: 64 },
        {
          name: "project",
          type: "relation",
          required: true,
          collectionId: projectsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: "day", type: "text", required: true, max: 32 },
        { name: "writing", type: "number", onlyInt: true },
        { name: "written", type: "number", onlyInt: true },
        { name: "corrected", type: "number", onlyInt: true },
        { name: "finished", type: "number", onlyInt: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_paper_stats_cockpit_id ON paper_stats (cockpit_id) WHERE cockpit_id != ''",
        "CREATE UNIQUE INDEX idx_paper_stats_project_day ON paper_stats (project, day)",
      ],
    });
    app.save(stats);
  },
  (app) => {
    for (const name of [
      "paper_stats",
      "paper_texts",
      "paper_articles",
      "paper_projects",
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        // Collection may not exist.
      }
    }
  },
);
