/// <reference path="../../../node_modules/pocketbase/types.d.ts" />
/**
 * Raise text limits on `cache.key` / `cache.value`.
 *
 * The init migration set `max: 0` intending "no limit", but PB falls back to
 * a 5000-char default for falsy values — too small for prompt keys (longest
 * in Cockpit is ~6.4k). Set generous explicit limits instead.
 */
migrate(
  (app) => {
    const cache = app.findCollectionByNameOrId("cache");
    for (const name of ["key", "value"]) {
      const field = cache.fields.getByName(name);
      field.max = 500000;
    }
    app.save(cache);
  },
  (app) => {
    const cache = app.findCollectionByNameOrId("cache");
    for (const name of ["key", "value"]) {
      const field = cache.fields.getByName(name);
      field.max = 5000;
    }
    app.save(cache);
  },
);
