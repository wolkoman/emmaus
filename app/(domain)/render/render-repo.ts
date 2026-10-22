import { pb } from "@/util/pocketbase";
import { pbFileUrl } from "@/util/pb-files";

/**
 * Pocketbase data access for the `renders` collection — the queue + result
 * store for server-side PDF rendering (see docs/pdf-render-jobs.md).
 *
 * A render record's lifecycle: pending -> running -> done | error. The
 * Kubernetes render Job owns the transitions after "pending"; the app only
 * ever creates records and reads them.
 */

export type RenderStatus = "pending" | "running" | "done" | "error";

export interface RenderRecord {
  id: string;
  url: string;
  status: RenderStatus;
  /** Public URL of the finished PDF; empty until status is "done". */
  pdfUrl: string;
  error: string;
  created: string;
  updated: string;
}

export interface PaperOptions {
  widthMm: number;
  heightMm: number;
}

function toRenderRecord(rec: {
  id: string;
  url: string;
  status: string;
  pdf: string;
  error: string;
  created: string;
  updated: string;
}): RenderRecord {
  return {
    id: rec.id,
    url: rec.url,
    status: rec.status as RenderStatus,
    pdfUrl: rec.pdf ? pbFileUrl("renders", rec.id, rec.pdf) : "",
    error: rec.error ?? "",
    created: rec.created,
    updated: rec.updated,
  };
}

/** Create a pending render record. The k8s Job picks it up by ID. */
export async function createRenderRecord(
  url: string,
  paper: PaperOptions,
): Promise<RenderRecord> {
  const client = await pb();
  const rec = await client.collection("renders").create({
    url,
    status: "pending",
    paper,
  });
  return toRenderRecord(rec as never);
}

export async function fetchRenderRecord(id: string): Promise<RenderRecord> {
  const client = await pb();
  const rec = await client.collection("renders").getOne(id);
  return toRenderRecord(rec as never);
}
