/// <reference path="../pb_data/types.d.ts" />

/**
 * `monthly_images` collection — images uploaded for Monatsblatt IMAGE tiles.
 *
 * One record per uploaded image (file field). Tiles store the public file
 * URL; records are never updated, only created (re-uploading a tile's image
 * creates a new record). API rules stay superuser-only — file URLs are
 * publicly served by PB regardless, which the print route relies on.
 */
migrate(
  (app) => {
    const images = new Collection({
      type: "base",
      name: "monthly_images",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: "image",
          type: "file",
          required: true,
          maxSelect: 1,
          maxSize: 15000000,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        },
        { name: "created", type: "autodate", onCreate: true },
      ],
    });
    app.save(images);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("monthly_images"));
    } catch (_) {
      // Collection may not exist.
    }
  },
);
