/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * `renders` collection — queue + result store for server-side PDF rendering
 * (see docs/pdf-render-jobs.md).
 *
 * Flow: the Next.js app creates a record (`status = "pending"`) and spawns a
 * Kubernetes Job. The job renders `url` with headless Chromium, uploads the
 * result into `pdf`, and sets `status` to "done" (or "error" + `error`).
 * The app polls the record until the PDF appears.
 *
 * Using PB as the handoff point keeps the k8s side stateless: a stuck render
 * can be inspected and re-queued straight from the PB admin UI.
 *
 * `paper` holds render options as JSON: { widthMm, heightMm }.
 */
migrate(
  (app) => {
    const renders = new Collection({
      type: "base",
      name: "renders",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "url", type: "text", required: true, max: 2000 },
        {
          name: "status",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["pending", "running", "done", "error"],
        },
        { name: "paper", type: "json", maxSize: 10000 },
        {
          name: "pdf",
          type: "file",
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ["application/pdf"],
        },
        { name: "error", type: "text", max: 10000 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE INDEX idx_renders_status ON renders (status)"],
    });
    app.save(renders);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("renders"));
    } catch (_) {
      // Collection may not exist.
    }
  },
);
