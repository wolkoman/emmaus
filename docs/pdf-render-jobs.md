# PDF Render Jobs (Kubernetes)

Server-side, fold-accurate PDF generation for print products (Monatsblatt
flyer, later possibly the Wochenblatt). The Next.js app on Vercel spawns a
**one-shot Kubernetes Job** per render; the Job renders a print route with
headless Chromium and uploads the PDF into Pocketbase. Nothing runs while
idle — zero standing RAM cost on the cluster.

## Architecture

```
Editor (Vercel)                     eco cluster                    Pocketbase
──────────────                      ───────────                    ──────────
startPdfRender(path, paper)
  1. create `renders` record  ────────────────────────────────────▶ status: pending
  2. POST Job to k8s API      ────▶ Job pod (512Mi req / 2Gi limit)
                                      3. GET print route (public URL)
                                      4. Chromium → PDF
                                      5. upload PDF, set status ───▶ status: done + pdf
pollPdfRender(id) every ~2s   ◀──────────────────────────────────── read record
  6. show download link (pdfUrl)      pod exits, Job TTL-cleaned
```

Design decisions:

- **Pocketbase is queue and result store.** The k8s side is stateless; a
  render's full state (status, error, PDF) is visible and fixable in the PB
  admin UI. The app never talks to the render pod.
- **The Job manifest lives in code** (`app/(domain)/render/render-job.ts`),
  not in the Helm chart, because Jobs are created ad hoc per render — there
  is nothing to `helm upgrade`.
- **Resources:** requests `512Mi/250m` (schedules on a memory-tight
  cluster), limits `2Gi/2cpu` (Chromium bursts during render).
  `activeDeadlineSeconds: 180` kills hung renders,
  `ttlSecondsAfterFinished: 600` auto-cleans finished Jobs.
- **Fonts/rendering determinism:** the renderer image is the official
  Playwright image with pinned Chromium + fonts, so a PDF renders
  identically regardless of who triggers it. The render script waits for
  `document.fonts.ready` before printing — critical for fold-accurate
  layouts.
- **Print-readiness contract:** print pages may mark elements with a
  `data-print-waiting` attribute while client-side layout is still settling
  (e.g. the Monatsblatt events-flow distribution measures and assigns
  content after hydration). The renderer waits until no such element exists
  (30 s timeout) before calling `page.pdf()`. Pages without the marker are
  unaffected.

## Components

| Piece                                | Location                                          |
| ------------------------------------ | ------------------------------------------------- |
| Renderer image (Dockerfile + script) | `deploy/renderer/`                                |
| Image build CI (pushes to GHCR)      | `.github/workflows/build-renderer.yml`            |
| `renders` PB collection migration    | `deploy/helm/pb_migrations/1729500800_renders.js` |
| Trigger ServiceAccount + RBAC        | `deploy/render-trigger-serviceaccount.yaml`       |
| Job creation + k8s API client        | `app/(domain)/render/render-job.ts`               |
| PB data access                       | `app/(domain)/render/render-repo.ts`              |
| Server actions for editor UIs        | `app/(domain)/render/render-actions.ts`           |
| Local smoke test                     | `scripts/smoke-render-job.ts`                     |

## Configuration (Vercel env vars)

Everything cluster-specific is an env var — **moving clusters requires no
code change** (see checklist below).

| Env var                 | Required         | Example / default                         | Purpose                                                                                                                                                |
| ----------------------- | ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `K8S_API_URL`           | yes              | `https://k8s.example.com:6443`            | Kubernetes API server                                                                                                                                  |
| `K8S_RENDER_TOKEN`      | yes              | (SA token)                                | Bearer token of `emmaus-render-trigger`                                                                                                                |
| `K8S_CA_CERT_B64`       | recommended      | (base64 PEM)                              | Cluster CA for TLS verification. If unset, TLS verification is skipped for the k8s API call.                                                           |
| `K8S_RENDER_NAMESPACE`  | no               | `emmaus`                                  | Namespace for render Jobs                                                                                                                              |
| `RENDERER_IMAGE`        | yes              | `ghcr.io/wolkoman/emmaus-renderer:latest` | Renderer image ref                                                                                                                                     |
| `K8S_IMAGE_PULL_SECRET` | if image private | `ghcr-creds`                              | dockerconfigjson Secret name in the namespace. The eco cluster already has `ghcr-creds` with pull access to the (private) renderer package — use that. |
| `NEXT_PUBLIC_SITE_URL`  | yes              | `https://emmaus.wien`                     | Origin used to build the print URL the pod fetches                                                                                                     |

The Job pod itself gets `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` injected from
the in-cluster `emmaus-secrets` Secret (same one Pocketbase uses) and reaches
PB via the in-cluster service `http://emmaus-pb`.

## One-time cluster setup

1. Pocketbase migration `1729500800_renders.js` ships with the chart and is
   applied automatically on the next `./deploy/local-deploy.sh` (PB runs
   migrations at startup, and the Deployment restarts when the migrations
   ConfigMap changes).
2. Create the trigger identity:

   ```bash
   kubectl apply -f deploy/render-trigger-serviceaccount.yaml
   ```

3. Extract the token and CA, set them on Vercel:

   ```bash
   # K8S_RENDER_TOKEN
   kubectl get secret emmaus-render-trigger-token -n emmaus \
     -o jsonpath='{.data.token}' | base64 -d

   # K8S_CA_CERT_B64 (already base64 in the secret — copy verbatim)
   kubectl get secret emmaus-render-trigger-token -n emmaus \
     -o jsonpath='{.data.ca\.crt}'

   # K8S_API_URL
   kubectl cluster-info
   ```

4. The GHCR image is private. On the eco cluster the existing `ghcr-creds`
   Secret already has pull access — just set
   `K8S_IMAGE_PULL_SECRET=ghcr-creds`. On a fresh cluster, recreate it:

   ```bash
   kubectl create secret docker-registry ghcr-creds -n emmaus \
     --docker-server=ghcr.io \
     --docker-username=<github-user> \
     --docker-password=<PAT with read:packages>
   ```

5. Build the image once via the `Build renderer image` workflow
   (`workflow_dispatch` or push to `deploy/renderer/**`).

## Moving to a new cluster — checklist

No code changes. In order:

1. Deploy Pocketbase there as usual (`deploy/README.md`); migrations create
   the `renders` collection automatically.
2. `kubectl apply -f deploy/render-trigger-serviceaccount.yaml` (creates
   namespace-scoped SA, token Secret, Role, RoleBinding — the namespace
   itself comes from `deploy/ci-serviceaccount.yaml`).
3. Re-create the `ghcr-creds` image pull secret (step 4 above).
4. Update on Vercel: `K8S_API_URL`, `K8S_RENDER_TOKEN`, `K8S_CA_CERT_B64`.
   Everything else stays.
5. Verify: trigger a render from an editor (or run the smoke test against
   the new API URL) and check `kubectl get jobs -n emmaus`.

Requirements on any target cluster:

- The k8s API server must be reachable from Vercel (public endpoint or
  tunnel/proxy).
- Pods must have egress to `NEXT_PUBLIC_SITE_URL` (they fetch the print
  route over the public internet).
- The in-cluster PB service name `emmaus-pb` and the `emmaus-secrets` Secret
  keys `PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD` are assumed by the Job manifest
  (both are conventions of this repo's Helm chart).

## Usage from an editor

```ts
import {
  startPdfRender,
  pollPdfRender,
} from "@/app/(domain)/render/render-actions";

// Fire — e.g. a 2×A4-landscape flyer sheet:
const { id } = await startPdfRender(`/monatsblatt/print/${name}`, {
  widthMm: 297,
  heightMm: 210,
});

// Poll every ~2s until done/error, then link record.pdfUrl:
const record = await pollPdfRender(id);
```

The print route must be **publicly reachable without auth** (the pod fetches
it anonymously). Use unguessable identifiers in the path if the content is
sensitive before publication.

One issue can have several layouts, each with its own route and paper size.
Monatsblatt has three: `/monatsblatt/print/<name>` (folded flyer, 2× A4
landscape), `/monatsblatt/print/<name>/poster` (A3 poster for the notice
board) and, only for issues with an Einlage,
`/monatsblatt/print/<name>/einlage` (duplex A4 landscape, the Einlage three
times per side for cutting) — `layoutPrintJob()` in
`app/monatsblatt/poster.ts` maps a layout to both values so route and paper
can't drift apart.

## Debugging runbook

| Symptom                      | Where to look                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render stuck in `pending`    | Job never started: `kubectl get jobs -n emmaus -l app=emmaus-render`. Check trigger env vars; a trigger failure is also written to the record's `error` field. |
| Render stuck in `running`    | Pod logs: `kubectl logs -n emmaus -l app=emmaus-render --tail=100`. `activeDeadlineSeconds` kills it after 3 min; re-trigger afterwards.                       |
| `status = error`             | The record's `error` field contains the failure message (HTTP status of the print route, timeout, PB upload error).                                            |
| Wrong fonts / shifted layout | The print route must serve webfonts with absolute URLs; the script waits for `document.fonts.ready`, but fonts blocked by CORS never become ready.             |
| `ImagePullBackOff`           | GHCR image private and `K8S_IMAGE_PULL_SECRET` missing/wrong, or the image was never built (run the workflow).                                                 |
| 401/403 from k8s API         | Token doesn't match the cluster (rotated, or old cluster's token after a move). Re-extract per setup step 3.                                                   |

Old jobs disappear after 10 min (`ttlSecondsAfterFinished`) — the durable
record of every render is the `renders` collection in Pocketbase.

## Local development / smoke test

Render against the local PB (`bun pb:local`) without any cluster — runs the
same container the cluster runs:

```bash
bun render:smoke
```

This creates a `renders` record in local PB, runs `deploy/renderer` via
Docker with `RENDER_RECORD_ID`, and prints the record's final status and PDF
URL. See `scripts/smoke-render-job.ts`.

### "PDF erstellen" from a local editor

The cluster Job fetches the print route over the network, so it needs a
publicly reachable URL of the dev server: `bun dev` provisions one with ngrok
and passes it as `NEXT_PUBLIC_SITE_URL` (`scripts/dev.mjs`).

| Symptom                                          | Fix                                                                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL ist nicht gesetzt`         | The tunnel never came up — check `.ngrok.log` and restart `bun dev` (it now kills leftover agents that squat the agent API without a tunnel). |
| Render job reports a 4xx/5xx for the print route | The tunnel points at a dev server that has meanwhile stopped, or the ngrok free-tier interstitial answers first — restart `bun dev`.          |

Every render error box in the editor also links the print route itself: it is
fold-accurate, so the browser's own "Print to PDF" (with background graphics
enabled) is a usable fallback without any tunnel.
