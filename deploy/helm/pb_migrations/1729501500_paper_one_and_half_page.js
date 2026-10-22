migrate(
  (app) => {
    const articles = app.findCollectionByNameOrId("paper_articles");
    const format = articles.fields.getByName("format");
    const values = [...format.values];
    if (!values.includes("C4100x4900x1_1/2")) {
      format.values = [...values, "C4100x4900x1_1/2"];
      app.save(articles);
    }
  },
  (app) => {
    const inUse = app.findRecordsByFilter(
      "paper_articles",
      'format = "C4100x4900x1_1/2"',
      "",
      1,
      0,
    );
    if (inUse.length) {
      throw new Error(
        "Cannot remove a page format still used by paper articles",
      );
    }
    const articles = app.findCollectionByNameOrId("paper_articles");
    const format = articles.fields.getByName("format");
    format.values = [...format.values].filter(
      (value) => value !== "C4100x4900x1_1/2",
    );
    app.save(articles);
  },
);
