import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertMediaResponse,
  assertNoMigrationFailures,
  migrationAssetUrl,
  validateMigrationPayload,
} from "./migration-validation";

test("absolute image URLs are not prefixed with the Cockpit host", () => {
  const external = "https://pbs.twimg.com/media/example?format=jpg&name=large";
  assert.equal(
    migrationAssetUrl("https://data.emmaus.wien", external),
    external,
  );
  assert.equal(
    migrationAssetUrl("https://data.emmaus.wien", "/storage/a b.jpg"),
    "https://data.emmaus.wien/storage/a%20b.jpg",
  );
});

test("HTTP 200 HTML fallback pages cannot be imported as images", () => {
  assert.throws(
    () => assertMediaResponse("text/html", new Uint8Array()),
    /received HTML/,
  );
  assert.throws(
    () =>
      assertMediaResponse(
        "image/jpeg",
        new TextEncoder().encode("<!DOCTYPE html><html>"),
      ),
    /received HTML/,
  );
  assert.doesNotThrow(() =>
    assertMediaResponse("image/jpeg", new Uint8Array([255, 216, 255])),
  );
});

test("rejects the EB31 format before writing to the old schema", () => {
  const field = { name: "format", type: "select", values: ["C3600x5400x2"] };
  const payload = { format: "C4100x4900x1_1/2" };
  assert.deepEqual(validateMigrationPayload(payload, [field]), [
    "format: unsupported select value",
  ]);
  field.values.push(payload.format);
  assert.deepEqual(validateMigrationPayload(payload, [field]), []);
});

test("detects dropped fields, required relations, text and numeric limits", () => {
  const errors = validateMigrationPayload(
    { project: "", text: "abcdef", count: 1.5, removed: "value" },
    [
      { name: "project", type: "relation", required: true },
      { name: "text", type: "text", max: 5 },
      { name: "count", type: "number", onlyInt: true },
    ],
  );
  assert.equal(errors.length, 4);
});

test("JSON and editor limits count UTF-8 bytes", () => {
  assert.equal(
    validateMigrationPayload({ html: "üü" }, [
      { name: "html", type: "editor", maxSize: 3 },
    ]).length,
    1,
  );
});

test("collected write failures cannot finish as success", () => {
  assert.doesNotThrow(() => assertNoMigrationFailures([]));
  assert.throws(
    () => assertNoMigrationFailures(["paper_articles: 2 writes failed"]),
    /Migration incomplete/,
  );
});
