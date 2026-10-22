/**
 * Smoke test for the Pocketbase liturgy repo adapter against the local PB
 * (requires `bun pb:local` + `bun pb:seed`).
 *
 * Run:
 *   POCKETBASE_URL=http://localhost:8090 \
 *     PB_ADMIN_EMAIL=admin@emmaus.local PB_ADMIN_PASSWORD=devpassword \
 *     tsx scripts/smoke-liturgy-repo-pb.ts
 */
import { pbLiturgyRepo as repo } from "../app/(domain)/liturgy/liturgy-repo.pb";
import {
  authenticateAdmin,
  personsRepo,
} from "../app/(domain)/users/persons-repo";
import {
  CpLiturgyRosterPosition,
  CpLiturgyRosterStatus,
  type CpLiturgyEvent,
  type CpLiturgyEventCancellations,
  type CpLiturgyRoster,
  type CpPerson,
} from "../util/cockpit.generated";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

async function main() {
  // --- reads ---
  const events = await repo.fetchLiturgyEvents();
  assert(events.length >= 3, "expected seeded liturgy_events");
  assert(
    events.every((e: CpLiturgyEvent) => e._id && typeof e.eventId === "string"),
    "events map _id/eventId",
  );
  assert(
    events.every((e: CpLiturgyEvent) => /^\d{4}-\d{2}-\d{2}$/.test(e.date)),
    'event dates use the Cockpit "YYYY-MM-DD" format',
  );
  console.log(`fetchLiturgyEvents: ${events.length} ok`);

  const rosters = await repo.fetchLiturgyRosters();
  assert(rosters.length >= 3, "expected seeded rosters");
  const r1 = rosters.find((r: CpLiturgyRoster) => r.position === "READER1");
  assert(r1, "seeded READER1 roster present");
  assert(r1.userName === "Anna Acolyte", "roster userName mapped");
  assert(
    events.some((e: CpLiturgyEvent) => e._id === r1.liturgyEventId),
    "roster.liturgyEventId matches an event _id (relation mapped)",
  );
  console.log(`fetchLiturgyRosters: ${rosters.length} ok`);

  const persons = await repo.fetchPersons();
  assert(persons.length >= 4, "expected seeded persons");
  const anna = persons.find((p: CpPerson) => p.name === "Anna Acolyte");
  assert(anna, "Anna present");
  assert(r1.userId === anna._id, "roster.userId matches person _id");
  const annaAgain = await repo.fetchOnePerson({ _id: anna._id });
  assert(annaAgain?.name === "Anna Acolyte", "fetchOnePerson by _id");
  console.log(`fetchPersons: ${persons.length} ok`);

  const liturgy = await repo.fetchLiturgy();
  assert(Object.keys(liturgy).length >= 1, "liturgies grouped by key");
  console.log(`fetchLiturgy: ${Object.keys(liturgy).length} dates ok`);

  // --- fetchOne event by _id and by eventId ---
  const e1 = events[0];
  const byId = await repo.fetchOneLiturgyEvent({ _id: e1._id });
  assert(byId?._id === e1._id, "fetchOneLiturgyEvent by _id");
  const byEventId = await repo.fetchOneLiturgyEvent({ eventId: e1.eventId });
  assert(byEventId?._id === e1._id, "fetchOneLiturgyEvent by eventId");
  const missing = await repo.fetchOneLiturgyEvent({ eventId: "nope" });
  assert(missing === undefined, "fetchOne miss returns undefined");

  // --- write round-trip: create + update event ---
  const created = await repo.saveLiturgyEvent({
    eventId: "smoke-cal-1",
    liturgyName: "ordinary-green",
    date: "2030-01-06",
  });
  assert(created._id, "created event has _id");
  assert(created.date === "2030-01-06", "date round-trips as YYYY-MM-DD");
  const updated = await repo.saveLiturgyEvent({
    _id: created._id,
    eventId: "smoke-cal-1",
    cancellations: [{ value: anna._id }],
  });
  assert(
    updated.cancellations.some(
      (c: CpLiturgyEventCancellations) => c.value === anna._id,
    ),
    "cancellations round-trip",
  );
  console.log("saveLiturgyEvent create/update ok");

  // --- roster upsert -> status update -> fetchOne -> delete ---
  const roster = await repo.saveLiturgyRoster({
    liturgyEventId: created._id,
    position: CpLiturgyRosterPosition.READER1,
    status: CpLiturgyRosterStatus.Assigned,
    userId: anna._id,
    userName: anna.name,
  });
  assert(roster._id, "roster created");
  assert(roster.userId === anna._id, "roster userId maps back to cockpit id");
  assert(roster.liturgyEventId === created._id, "roster event id maps back");

  const informed = await repo.saveLiturgyRoster({
    _id: roster._id,
    status: CpLiturgyRosterStatus.Informed,
  });
  assert(informed.status === "informed", "partial status update");
  assert(informed.userId === anna._id, "partial update keeps person");

  const found = await repo.fetchOneLiturgyRoster({
    liturgyEventId: created._id,
    position: CpLiturgyRosterPosition.READER1,
  });
  assert(found?._id === roster._id, "fetchOneLiturgyRoster by event+position");

  await repo.deleteLiturgyRoster(roster._id);
  const gone = await repo.fetchOneLiturgyRoster({
    liturgyEventId: created._id,
    position: CpLiturgyRosterPosition.READER1,
  });
  assert(gone === undefined, "roster deleted");
  console.log("roster create/update/fetchOne/delete ok");

  // --- saveLiturgy upsert (calendar import path) ---
  await repo.saveLiturgy({
    "2031-12-25": [
      {
        name: "Hochfest der Geburt des Herrn",
        rank: "H",
        color: "w",
        reading1: "Jes 52,7-10",
        reading2: "Hebr 1,1-6",
        psalm: "Ps 98",
        evangelium: "Joh 1,1-18",
      },
    ],
  });
  let liturgyAfter = await repo.fetchLiturgy();
  assert(
    liturgyAfter["2031-12-25"]?.[0]?.name === "Hochfest der Geburt des Herrn",
    "saveLiturgy creates new date rows",
  );
  // Idempotent re-run with a change: updates in place, no duplicate variant.
  await repo.saveLiturgy({
    "2031-12-25": [
      {
        name: "Hochfest der Geburt des Herrn",
        rank: "H",
        color: "w",
        reading1: "Jes 52,7-10",
        reading2: "Hebr 1,1-6",
        psalm: "Ps 98 (98),1-6",
        evangelium: "Joh 1,1-18",
      },
    ],
  });
  liturgyAfter = await repo.fetchLiturgy();
  assert(
    liturgyAfter["2031-12-25"]?.length === 1 &&
      liturgyAfter["2031-12-25"][0].psalm === "Ps 98 (98),1-6",
    "saveLiturgy upserts idempotently",
  );
  console.log("saveLiturgy upsert ok");

  // --- persons repo: username lookup, code save, admin auth ---
  const pRepo = personsRepo();
  const annaByUsername = await pRepo.fetchPersonByUsername("anna");
  assert(
    annaByUsername?.name === "Anna Acolyte" &&
      annaByUsername.code === "anna-code",
    "fetchPersonByUsername",
  );
  assert(
    (await pRepo.fetchPersonByUsername("nobody")) === undefined,
    "fetchPersonByUsername miss returns undefined",
  );
  await pRepo.savePersonCode(annaByUsername._id, "anna-code-2");
  assert(
    (await pRepo.fetchPersonByUsername("anna"))?.code === "anna-code-2",
    "savePersonCode round-trip",
  );
  await pRepo.savePersonCode(annaByUsername._id, "anna-code"); // restore

  // Admin auth goes against `_superusers` — locally the docker superuser.
  const admin = await authenticateAdmin("admin@emmaus.local", "devpassword");
  assert(admin?.email === "admin@emmaus.local", "authenticateAdmin success");
  assert(
    admin.competences.length > 0,
    "admin gets competences from the admin group",
  );
  assert(
    (await authenticateAdmin("admin@emmaus.local", "wrong")) === undefined,
    "authenticateAdmin rejects bad password",
  );
  console.log("persons repo + admin auth ok");

  // --- cache collection round-trip (keys are full prompts) ---
  const { pb } = await import("../util/pocketbase");
  const client = await pb();
  const cacheKey = 'smoke "prompt" with\nnewlines and quotes';
  const staleCache = await client.collection("cache").getList(1, 1, {
    filter: client.filter("key = {:key}", { key: cacheKey }),
  });
  if (staleCache.items[0])
    await client.collection("cache").delete(staleCache.items[0].id);
  await client.collection("cache").create({ key: cacheKey, value: "v1" });
  const cacheHit = await client.collection("cache").getList(1, 1, {
    filter: client.filter("key = {:key}", { key: cacheKey }),
  });
  assert(cacheHit.items[0]?.value === "v1", "cache round-trip with tricky key");
  await client.collection("cache").delete(cacheHit.items[0].id);
  console.log("cache round-trip ok");

  // --- forms repo: newsletter / shared_links / alpha ---
  const forms = await import("../app/(domain)/forms/forms-repo");

  await forms.createNewsletterSubscription({
    mail: "smoke-news@example.com",
    token: "smoke-token",
    active: false,
  });
  const sub = await forms.fetchOneNewsletter({ token: "smoke-token" });
  assert(sub?.mail === "smoke-news@example.com", "newsletter fetch by token");
  await forms.activateNewsletterSubscription(sub._id);
  const activated = await forms.fetchOneNewsletter({
    mail: "smoke-news@example.com",
  });
  assert(activated?.active === true, "newsletter activation");
  const recipients = await forms.fetchNewsletterRecipients();
  assert(
    recipients.some((r) => r.mail === "smoke-news@example.com"),
    "newsletter recipients list",
  );
  await client
    .collection("newsletter")
    .delete(
      (
        await client
          .collection("newsletter")
          .getFirstListItem(
            client.filter("mail = {:m}", { m: "smoke-news@example.com" }),
          )
      ).id,
    );

  const link = await forms.createSharedLink({
    folder: "folder-1",
    expiration: new Date(Date.now() + 86400000).toISOString(),
    ids: [{ value: "photo-1.jpg" }],
  });
  const linkAgain = await forms.fetchOneSharedLink(link._id);
  assert(
    linkAgain?.folder === "folder-1" &&
      linkAgain.ids[0]?.value === "photo-1.jpg",
    "shared link round-trip",
  );
  await client
    .collection("shared_links")
    .delete(
      (
        await client
          .collection("shared_links")
          .getFirstListItem(client.filter("folder = {:f}", { f: "folder-1" }))
      ).id,
    );

  const alpha = await forms.createAlphaRegistration({
    name: "Smoke Alpha",
    phone: "0664",
    mail: "alpha-smoke@example.com",
    postal: "1100",
  });
  assert(alpha._id, "alpha registration created");
  await client.collection("alpha_registrations").delete(alpha._id);
  console.log("forms repo ok");

  // --- paper repo ---
  const paper = await import("../app/(domain)/paper/paper-repo");
  const projRec = await client.collection("paper_projects").create({
    name: "Smoke Ausgabe",
    deadline: "2031-09-01",
    printrelease: "2031-10-01",
  });
  const project = await paper.fetchOnePaperProject(projRec.id);
  assert(project?.name === "Smoke Ausgabe", "paper project fetch");
  assert(project._created > 0, "paper project _created mapped");

  const article = await paper.createPaperArticle({
    name: "Smoke Artikel",
    projectId: projRec.id,
    status: "writing" as never,
    author: "Smoke Author",
    format: "C2600x3600x1" as never,
    char_min: 100,
    char_max: 200,
    gid: "",
  });
  assert(
    article._id && article.project._id === projRec.id,
    "article created with project link",
  );
  await paper.updatePaperArticle(article._id, { gid: "smoke-gid" });
  const articleAgain = await paper.fetchOnePaperArticle(article._id);
  assert(articleAgain?.gid === "smoke-gid", "article gid update");

  const articles = await paper.fetchPaperArticles(projRec.id);
  assert(articles.length === 1, "articles by project");

  const text1 = await paper.savePaperText({
    articleId: article._id,
    text: "v1",
  });
  assert(text1._created > 0, "text version from autodate");
  const text2 = await paper.savePaperText({
    _id: text1._id,
    articleId: article._id,
    text: "v1-edited",
  });
  assert(text2._id === text1._id, "text overwrite by _id");
  const texts = await paper.fetchPaperTexts(article._id);
  assert(
    texts.length === 1 && texts[0].text === "v1-edited",
    "texts by article",
  );

  await paper.upsertPaperStats({
    projectId: projRec.id,
    day: "2031-08-01",
    writing: 4,
    written: 3,
    corrected: 2,
    finished: 1,
  });
  await paper.upsertPaperStats({
    projectId: projRec.id,
    day: "2031-08-01",
    writing: 4,
    written: 4,
    corrected: 2,
    finished: 1,
  });
  const stats = await paper.fetchPaperStats(projRec.id);
  assert(
    stats.length === 1 && stats[0].written === 4,
    "stats upsert by (project, day)",
  );

  // Cleanup (cascades to articles/texts/stats via relations where set).
  await client
    .collection("paper_articles")
    .delete(
      (
        await client
          .collection("paper_articles")
          .getFirstListItem(
            client.filter("name = {:n}", { n: "Smoke Artikel" }),
          )
      ).id,
    );
  await client.collection("paper_projects").delete(projRec.id);
  console.log("paper repo ok");

  // --- content repo (sites / articles / impressum) ---
  const content = await import("../app/(domain)/content/content-repo");

  // Sites: reuse the migrated root if present, otherwise create one.
  let rootId: string | undefined;
  let createdRoot = false;
  try {
    rootId = (
      await client
        .collection("sites")
        .getFirstListItem(client.filter("name = {:n}", { n: "emmaus.wien" }))
    ).id;
  } catch {
    rootId = (await client.collection("sites").create({ name: "emmaus.wien" }))
      .id;
    createdRoot = true;
  }
  const smokeSite = await client.collection("sites").create({
    name: "Smoke Seite",
    slug: "smoke-seite",
    html: "<p>Hallo</p>",
    parent: rootId,
    sort_order: 999,
    cockpit_modified: 1600000000,
  });
  let structure = await content.fetchSiteStructure();
  const smokeNode = structure.find((s) => s.slug === "smoke-seite");
  assert(smokeNode, "smoke site appears in structure");
  assert(
    smokeNode.level === 0 && smokeNode.parent === null,
    "root children have level 0 / no parent",
  );
  assert(smokeNode.html === "<p>Hallo</p>", "site html mapped");
  assert(
    smokeNode._modified === 1600000000,
    "unedited site keeps preserved cockpit_modified",
  );
  await client.collection("sites").update(smokeSite.id, {
    html: "<p>Hallo 2</p>",
  });
  structure = await content.fetchSiteStructure();
  const edited = structure.find((s) => s.slug === "smoke-seite");
  assert(
    edited && edited._modified > 1600000000,
    "edited-in-PB site switches _modified to PB's updated",
  );
  await client.collection("sites").delete(smokeSite.id);
  if (createdRoot) await client.collection("sites").delete(rootId);

  // Articles: mapping + lookup by id and by legacy slug (no image -> empty
  // imageUrl). The publication date is PB's own `created`, so a freshly created
  // article is the newest one.
  const smokeArticle = await client.collection("articles").create({
    title: "Smoke Artikel Web",
    title_slug: "smoke-artikel-web",
    author: "Smoke",
    content: "<p>Inhalt</p>",
    public: true,
  });
  const articleList = await content.fetchArticles();
  assert(
    articleList[0]?._id === smokeArticle.id,
    "articles sorted by newest created first",
  );
  assert(
    articleList.every(
      (a, i) => i === 0 || articleList[i - 1]._created >= a._created,
    ),
    "articles ordered by descending created",
  );
  const webArticle = await content.fetchArticleById(smokeArticle.id);
  assert(webArticle?.content === "<p>Inhalt</p>", "article by id");
  assert(webArticle._created > 0, "article exposes created as its date");
  assert(webArticle.imageUrl === "", "missing image maps to empty url");
  assert(
    (await content.fetchArticleBySlug("smoke-artikel-web"))?._id ===
      smokeArticle.id,
    "article by legacy title_slug",
  );
  assert(
    (await content.fetchArticleById("nope-nope-nope15")) === undefined,
    "article miss returns undefined",
  );
  assert(
    (await content.fetchArticleBySlug("nope-nope")) === undefined,
    "legacy slug miss returns undefined",
  );
  await client.collection("articles").delete(smokeArticle.id);

  // Impressum: single-row read (create a temp row if the collection is empty).
  const hadImpressum =
    (await client.collection("impressum").getList(1, 1)).totalItems > 0;
  if (!hadImpressum) {
    await client
      .collection("impressum")
      .create({ title: "Impressum", content: "<p>Smoke</p>" });
  }
  const impressum = await content.fetchImpressum();
  assert(impressum.content.length > 0, "impressum content non-empty");
  if (!hadImpressum) {
    const row = (await client.collection("impressum").getList(1, 1)).items[0];
    await client.collection("impressum").delete(row.id);
  }
  console.log("content repo ok");

  console.log("\nAll smoke checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
