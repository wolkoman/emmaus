import {
  createRenderRecord,
  fetchRenderRecord,
  type PaperOptions,
  type RenderRecord,
} from "@/app/(domain)/render/render-repo";

/**
 * Spawns Kubernetes Jobs that render a URL to PDF (see
 * docs/pdf-render-jobs.md for the full architecture and runbook).
 *
 * The app never talks to the render pod directly — it creates a `renders`
 * record in Pocketbase, creates a one-shot k8s Job pointing at that record,
 * and then polls the record until the Job has uploaded the PDF. That keeps
 * the trigger fire-and-forget and Pocketbase the single source of truth.
 *
 * Cluster portability: everything cluster-specific is an env var. Moving the
 * cluster means re-applying deploy/render-trigger-serviceaccount.yaml and
 * updating these on Vercel — no code change:
 *
 *   K8S_API_URL          Kubernetes API server URL (e.g. https://k8s.example:6443)
 *   K8S_RENDER_TOKEN     ServiceAccount token of emmaus-render-trigger
 *   K8S_RENDER_NAMESPACE Namespace for render Jobs (default: "emmaus")
 *   K8S_CA_CERT_B64      Optional: base64 PEM of the cluster CA. If unset,
 *                        TLS verification is DISABLED for the k8s API call
 *                        (acceptable only because the bearer token — not the
 *                        connection — is the secret; prefer setting it).
 *   RENDERER_IMAGE       Renderer image ref (e.g. ghcr.io/wolkoman/emmaus-renderer:latest)
 *   K8S_IMAGE_PULL_SECRET Optional: name of a dockerconfigjson Secret in the
 *                        namespace, needed if RENDERER_IMAGE is private.
 */

const NAMESPACE = process.env.K8S_RENDER_NAMESPACE ?? "emmaus";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. PDF rendering needs K8S_API_URL, ` +
        `K8S_RENDER_TOKEN and RENDERER_IMAGE — see docs/pdf-render-jobs.md.`,
    );
  }
  return value;
}

/**
 * The Job manifest. Kept in code (not a Helm template) because it is created
 * ad hoc per render, not deployed; the image and record ID are the only
 * variable parts.
 */
function renderJobManifest(recordId: string, image: string) {
  return {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      generateName: "emmaus-render-",
      namespace: NAMESPACE,
      labels: { app: "emmaus-render", "render-record": recordId },
    },
    spec: {
      // Clean up finished Jobs automatically; the result lives in PB.
      ttlSecondsAfterFinished: 600,
      // Hard cap: a render should take ~10s. Kill anything hung.
      activeDeadlineSeconds: 180,
      // One retry for transient failures (image pull hiccup, node pressure).
      backoffLimit: 1,
      template: {
        metadata: { labels: { app: "emmaus-render" } },
        spec: {
          restartPolicy: "Never" as const,
          ...(process.env.K8S_IMAGE_PULL_SECRET
            ? {
                imagePullSecrets: [{ name: process.env.K8S_IMAGE_PULL_SECRET }],
              }
            : {}),
          containers: [
            {
              name: "render",
              image,
              env: [
                { name: "PB_URL", value: "http://emmaus-pb" },
                { name: "RENDER_RECORD_ID", value: recordId },
                {
                  name: "PB_ADMIN_EMAIL",
                  valueFrom: {
                    secretKeyRef: {
                      name: "emmaus-secrets",
                      key: "PB_ADMIN_EMAIL",
                    },
                  },
                },
                {
                  name: "PB_ADMIN_PASSWORD",
                  valueFrom: {
                    secretKeyRef: {
                      name: "emmaus-secrets",
                      key: "PB_ADMIN_PASSWORD",
                    },
                  },
                },
              ],
              resources: {
                // Low request so the Job schedules on a memory-tight
                // cluster; high limit so Chromium can burst while rendering.
                requests: { memory: "512Mi", cpu: "250m" },
                limits: { memory: "2Gi", cpu: "2" },
              },
            },
          ],
        },
      },
    },
  };
}

/** Create the Job via the Kubernetes API using the render-trigger token. */
async function createK8sJob(recordId: string): Promise<void> {
  const apiUrl = requiredEnv("K8S_API_URL").replace(/\/$/, "");
  const token = requiredEnv("K8S_RENDER_TOKEN");
  const image = requiredEnv("RENDERER_IMAGE");

  const caCertB64 = process.env.K8S_CA_CERT_B64;
  // Node's fetch (undici) verifies TLS against the system store, which won't
  // contain a self-managed cluster CA. Provide the CA via env; otherwise fall
  // back to skipping verification for this one request.
  const { Agent } = await import("undici");
  const dispatcher = new Agent({
    connect: caCertB64
      ? { ca: Buffer.from(caCertB64, "base64").toString("utf8") }
      : { rejectUnauthorized: false },
  });

  const res = await fetch(
    `${apiUrl}/apis/batch/v1/namespaces/${NAMESPACE}/jobs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(renderJobManifest(recordId, image)),
      // @ts-expect-error: dispatcher is an undici extension of fetch options.
      dispatcher,
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Kubernetes Job creation failed (${res.status}): ${body.slice(0, 500)}`,
    );
  }
}

/**
 * Kick off a PDF render for `url` and return the pending render record.
 * Callers poll the record via `getRender` until status is done/error.
 *
 * `url` must be publicly reachable from inside the cluster (the print route
 * must not require auth — use an unguessable name/token in the URL instead).
 */
export async function requestPdfRender(
  url: string,
  paper: PaperOptions,
): Promise<RenderRecord> {
  const record = await createRenderRecord(url, paper);
  try {
    await createK8sJob(record.id);
  } catch (err) {
    // Surface trigger failures on the record so the UI shows them too.
    const client = await (await import("@/util/pocketbase")).pb();
    await client
      .collection("renders")
      .update(record.id, {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      })
      .catch(() => {});
    throw err;
  }
  return record;
}

export async function getRender(id: string): Promise<RenderRecord> {
  return fetchRenderRecord(id);
}
