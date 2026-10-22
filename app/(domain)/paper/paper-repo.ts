import type {
  CpPaperArticles,
  CpPaperArticlesFormat,
  CpPaperArticlesStatus,
  CpPaperProjects,
  CpPaperStats,
  CpPaperTexts,
} from "@/util/cockpit.generated";
import type {
  PaperArticlesResponse,
  PaperProjectsResponse,
  PaperStatsResponse,
  PaperTextsResponse,
} from "@/pb/pocketbase-types";
import { pb } from "@/util/pocketbase";
import { pbFileUrl } from "@/util/pb-files";

/**
 * Pocketbase data access for the Redaktion / Emmausbote editorial slice
 * (paper_projects, paper_articles, paper_texts, paper_stats). PB-only.
 *
 * Returned objects keep the Cockpit-era shapes: `_id` exposes an article's or
 * text's original Cockpit id when migrated (article ids appear in URLs and
 * Slack messages; projects use their PB id), relation fields surface as `{ _id, link }` objects, and
 * `_created`/`_modified` map to PB's autodate fields in epoch seconds
 * (paper_texts' `_created` doubles as the editor's version number).
 */

function isNotFound(err: unknown): boolean {
  return (
    !!err && typeof err === "object" && "status" in err && err.status === 404
  );
}

const exposedId = (r: { id: string; cockpit_id: string }) =>
  r.cockpit_id || r.id;

const toEpochSeconds = (iso: string): number =>
  iso ? Math.floor(new Date(iso).getTime() / 1000) : 0;

async function findProject(id: string) {
  const client = await pb();
  try {
    return await client
      .collection("paper_projects")
      .getOne<PaperProjectsResponse>(id);
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

async function findByEitherId(
  collection: "paper_articles" | "paper_texts",
  id: string,
) {
  const client = await pb();
  try {
    return await client
      .collection(collection)
      .getFirstListItem(
        client.filter("cockpit_id = {:id} || id = {:id}", { id }),
      );
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

// ---- projects ----

function toCpProject(p: PaperProjectsResponse): CpPaperProjects {
  return {
    __collectionName: "paper_projects",
    _id: p.id,
    _created: toEpochSeconds(p.created),
    _modified: toEpochSeconds(p.updated),
    name: p.name,
    deadline: p.deadline,
    printrelease: p.printrelease,
    published: p.published,
    pdfUrl: pbFileUrl("paper_projects", p.id, p.pdf),
    coverUrl: pbFileUrl("paper_projects", p.id, p.cover),
  };
}

/** All projects, latest deadline first; archived issues without one go last. */
export async function fetchPaperProjects(): Promise<CpPaperProjects[]> {
  const client = await pb();
  const rows = await client
    .collection("paper_projects")
    .getFullList({ sort: "-deadline,-created" });
  return rows
    .filter((p) => !/^BLICKpunkt(?:\s|$)/i.test(p.name))
    .map((p) => toCpProject(p as PaperProjectsResponse));
}

export async function fetchOnePaperProject(
  id: string,
): Promise<CpPaperProjects | undefined> {
  const rec = await findProject(id);
  return rec ? toCpProject(rec) : undefined;
}

// ---- articles ----

type ArticleExpand = { project?: PaperProjectsResponse };

function toCpArticle(a: PaperArticlesResponse<ArticleExpand>): CpPaperArticles {
  const project = a.expand?.project;
  return {
    __collectionName: "paper_articles",
    _id: exposedId(a),
    _created: toEpochSeconds(a.created),
    _modified: toEpochSeconds(a.updated),
    name: a.name,
    project: {
      _id: a.project,
      link: "paper_projects",
      display: project?.name,
    },
    status: a.status as CpPaperArticlesStatus,
    author: a.author,
    format: a.format as CpPaperArticlesFormat,
    char_min: a.char_min,
    char_max: a.char_max,
    gid: a.gid,
  };
}

export async function fetchPaperArticles(
  projectId: string,
): Promise<CpPaperArticles[]> {
  const client = await pb();
  const project = await findProject(projectId);
  if (!project) return [];
  const rows = await client.collection("paper_articles").getFullList({
    filter: client.filter("project = {:id}", { id: project.id }),
    expand: "project",
    sort: "-created",
  });
  return rows.map((a) =>
    toCpArticle(a as PaperArticlesResponse<ArticleExpand>),
  );
}

export async function fetchOnePaperArticle(
  id: string,
): Promise<CpPaperArticles | undefined> {
  const client = await pb();
  try {
    const rec = await client
      .collection("paper_articles")
      .getFirstListItem(
        client.filter("cockpit_id = {:id} || id = {:id}", { id }),
        { expand: "project" },
      );
    return toCpArticle(rec as PaperArticlesResponse<ArticleExpand>);
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

export async function createPaperArticle(data: {
  name: string;
  projectId: string;
  status: CpPaperArticlesStatus;
  author: string;
  format: CpPaperArticlesFormat;
  char_min: number;
  char_max: number;
  gid: string;
}): Promise<CpPaperArticles> {
  const client = await pb();
  const project = await findProject(data.projectId);
  if (!project) throw new Error(`paper_project ${data.projectId} not found`);
  const rec = await client.collection("paper_articles").create(
    {
      name: data.name,
      project: project.id,
      status: data.status,
      author: data.author,
      format: data.format,
      char_min: data.char_min,
      char_max: data.char_max,
      gid: data.gid,
    },
    { expand: "project" },
  );
  return toCpArticle(rec as PaperArticlesResponse<ArticleExpand>);
}

export async function updatePaperArticle(
  id: string,
  data: Partial<Pick<CpPaperArticles, "status" | "gid" | "name" | "author">>,
): Promise<void> {
  const client = await pb();
  const rec = await findByEitherId("paper_articles", id);
  if (!rec) throw new Error(`paper_article ${id} not found`);
  await client.collection("paper_articles").update(rec.id, data);
}

// ---- texts (versioned editor content) ----

type TextExpand = { article?: PaperArticlesResponse };

function toCpText(t: PaperTextsResponse<TextExpand>): CpPaperTexts {
  const article = t.expand?.article;
  return {
    __collectionName: "paper_texts",
    _id: exposedId(t),
    _created: toEpochSeconds(t.created),
    _modified: toEpochSeconds(t.updated),
    article: {
      _id: article ? exposedId(article) : t.article,
      link: "paper_articles",
    },
    text: t.text,
    datetime: t.datetime,
  };
}

/** All text versions of an article, newest first. */
export async function fetchPaperTexts(
  articleId: string,
): Promise<CpPaperTexts[]> {
  const client = await pb();
  const article = await findByEitherId("paper_articles", articleId);
  if (!article) return [];
  const rows = await client.collection("paper_texts").getFullList({
    filter: client.filter("article = {:id}", { id: article.id }),
    expand: "article",
    sort: "-created",
  });
  return rows.map((t) => toCpText(t as PaperTextsResponse<TextExpand>));
}

/** Create a new text version, or overwrite an existing one by `_id`. */
export async function savePaperText(data: {
  _id?: string;
  articleId: string;
  text: string;
}): Promise<CpPaperTexts> {
  const client = await pb();
  const existing = data._id
    ? await findByEitherId("paper_texts", data._id)
    : undefined;
  if (existing) {
    const rec = await client
      .collection("paper_texts")
      .update(existing.id, { text: data.text }, { expand: "article" });
    return toCpText(rec as PaperTextsResponse<TextExpand>);
  }
  const article = await findByEitherId("paper_articles", data.articleId);
  if (!article) throw new Error(`paper_article ${data.articleId} not found`);
  const rec = await client
    .collection("paper_texts")
    .create({ article: article.id, text: data.text }, { expand: "article" });
  return toCpText(rec as PaperTextsResponse<TextExpand>);
}

// ---- stats ----

function toCpStats(s: PaperStatsResponse, projectId: string): CpPaperStats {
  return {
    __collectionName: "paper_stats",
    _id: exposedId(s),
    _created: 0,
    _modified: 0,
    writing: s.writing,
    written: s.written,
    corrected: s.corrected,
    finished: s.finished,
    project: { _id: projectId, link: "paper_projects" },
    day: s.day,
  };
}

/** Daily stats of a project, oldest day first. */
export async function fetchPaperStats(
  projectId: string,
): Promise<CpPaperStats[]> {
  const client = await pb();
  const project = await findProject(projectId);
  if (!project) return [];
  const rows = await client.collection("paper_stats").getFullList({
    filter: client.filter("project = {:id}", { id: project.id }),
    sort: "day",
  });
  return rows.map((s) => toCpStats(s as PaperStatsResponse, project.id));
}

/** Upsert the stats row for (project, day). */
export async function upsertPaperStats(data: {
  projectId: string;
  day: string;
  writing: number;
  written: number;
  corrected: number;
  finished: number;
}): Promise<void> {
  const client = await pb();
  const project = await findProject(data.projectId);
  if (!project) throw new Error(`paper_project ${data.projectId} not found`);
  const payload = {
    project: project.id,
    day: data.day,
    writing: data.writing,
    written: data.written,
    corrected: data.corrected,
    finished: data.finished,
  };
  try {
    const existing = await client.collection("paper_stats").getFirstListItem(
      client.filter("project = {:project} && day = {:day}", {
        project: project.id,
        day: data.day,
      }),
    );
    await client.collection("paper_stats").update(existing.id, payload);
  } catch (err) {
    if (!isNotFound(err)) throw err;
    await client.collection("paper_stats").create(payload);
  }
}
