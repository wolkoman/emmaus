import { test } from "node:test";
import assert from "node:assert/strict";
import type { drive_v3 } from "googleapis";
import { prepareArticleWithPoolDocument } from "../app/redaktion/[projectId]/googleDocPreparation";

function mockDrive(responses: drive_v3.Schema$File[][]) {
  return {
    files: { list: async () => ({ data: { files: responses.shift() ?? [] } }) },
  } as unknown as drive_v3.Drive;
}

test("missing Pool returns an actionable error without creating an article", async () => {
  let created = false;
  await assert.rejects(
    prepareArticleWithPoolDocument(mockDrive([[]]), "root", async () => {
      created = true;
    }),
    /Pool.*nicht erreichbar/,
  );
  assert.equal(created, false);
});

test("empty Pool does not create an article", async () => {
  let created = false;
  await assert.rejects(
    prepareArticleWithPoolDocument(
      mockDrive([[{ id: "pool" }], []]),
      "root",
      async () => {
        created = true;
      },
    ),
    /keine freien Dokumente/,
  );
  assert.equal(created, false);
});

test("Drive access failure does not create an article", async () => {
  let created = false;
  const drive = {
    files: {
      list: async () => {
        throw new Error("403");
      },
    },
  } as unknown as drive_v3.Drive;
  await assert.rejects(
    prepareArticleWithPoolDocument(drive, "root", async () => {
      created = true;
    }),
    /403/,
  );
  assert.equal(created, false);
});

test("available document is checked before article creation", async () => {
  const responses = [[{ id: "pool" }], [{ id: "doc", parents: ["pool"] }]];
  let creations = 0;
  const result = await prepareArticleWithPoolDocument(
    mockDrive(responses),
    "root",
    async () => {
      assert.equal(responses.length, 0);
      creations++;
      return { _id: "article" };
    },
  );
  assert.equal(creations, 1);
  assert.equal(result.documentId, "doc");
  assert.equal(result.article._id, "article");
});
