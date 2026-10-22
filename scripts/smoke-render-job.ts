/**
 * Smoke test for the PDF render job (docs/pdf-render-jobs.md) — runs the
 * exact container the cluster runs, but locally via Docker against local
 * Pocketbase. No Kubernetes involved.
 *
 * Prerequisites: Docker running, local PB up (`bun pb:local`).
 *
 *   bun render:smoke
 *
 * Options via env:
 *   SMOKE_RENDER_URL  Page to render (default: https://emmaus.wien).
 *                     To render your dev server, start `bun dev` and use
 *                     http://host.docker.internal:3000/...
 */
import { execSync } from "node:child_process";

const PB_HOST_URL = "http://localhost:8090"; // from this script
const PB_DOCKER_URL = "http://host.docker.internal:8090"; // from the container
const PB_ADMIN_EMAIL = "admin@emmaus.local";
const PB_ADMIN_PASSWORD = "devpassword";
const RENDER_URL = process.env.SMOKE_RENDER_URL ?? "https://emmaus.wien";
const IMAGE = "emmaus-renderer:smoke";

async function pbFetch(path: string, init: RequestInit = {}, token?: string) {
  const res = await fetch(`${PB_HOST_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`PB ${path} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log("1/4 Building renderer image...");
  execSync(`docker build -t ${IMAGE} deploy/renderer`, { stdio: "inherit" });

  console.log("2/4 Creating `renders` record in local PB...");
  const { token } = await pbFetch(
    "/api/collections/_superusers/auth-with-password",
    {
      method: "POST",
      body: JSON.stringify({
        identity: PB_ADMIN_EMAIL,
        password: PB_ADMIN_PASSWORD,
      }),
    },
  );
  const record = await pbFetch(
    "/api/collections/renders/records",
    {
      method: "POST",
      body: JSON.stringify({
        url: RENDER_URL,
        status: "pending",
        paper: { widthMm: 297, heightMm: 210 },
      }),
    },
    token,
  );
  console.log(`   record ${record.id} -> ${RENDER_URL}`);

  console.log("3/4 Running render container...");
  execSync(
    [
      "docker run --rm",
      "--add-host=host.docker.internal:host-gateway",
      `-e PB_URL=${PB_DOCKER_URL}`,
      `-e PB_ADMIN_EMAIL=${PB_ADMIN_EMAIL}`,
      `-e PB_ADMIN_PASSWORD=${PB_ADMIN_PASSWORD}`,
      `-e RENDER_RECORD_ID=${record.id}`,
      IMAGE,
    ].join(" "),
    { stdio: "inherit" },
  );

  console.log("4/4 Checking record...");
  const done = await pbFetch(
    `/api/collections/renders/records/${record.id}`,
    {},
    token,
  );
  if (done.status !== "done" || !done.pdf) {
    throw new Error(
      `Expected status "done" with a PDF, got "${done.status}" (error: ${done.error})`,
    );
  }
  console.log(
    `OK — PDF: ${PB_HOST_URL}/api/files/renders/${done.id}/${done.pdf}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
