/**
 * One-shot PDF render job (see docs/pdf-render-jobs.md).
 *
 * Reads a `renders` record from Pocketbase, renders its `url` to a PDF with
 * headless Chromium, uploads the PDF back into the record, and exits.
 *
 * All configuration comes from environment variables so the same image runs
 * unchanged on any cluster:
 *
 *   PB_URL             Pocketbase base URL (in-cluster: http://emmaus-pb)
 *   PB_ADMIN_EMAIL     Superuser identity (from the emmaus-secrets Secret)
 *   PB_ADMIN_PASSWORD  Superuser password (from the emmaus-secrets Secret)
 *   RENDER_RECORD_ID   ID of the `renders` record to process
 *
 * Errors are written back to the record (`status = "error"`) so the editor
 * UI can surface them; the process still exits non-zero so the Job shows up
 * as failed in Kubernetes.
 */
import { chromium } from "playwright";

const PB_URL = required("PB_URL").replace(/\/$/, "");
const PB_ADMIN_EMAIL = required("PB_ADMIN_EMAIL");
const PB_ADMIN_PASSWORD = required("PB_ADMIN_PASSWORD");
const RENDER_RECORD_ID = required("RENDER_RECORD_ID");

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(2);
  }
  return value;
}

async function pbFetch(path, init = {}, token) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: token } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `PB ${init.method ?? "GET"} ${path} -> ${res.status}: ${body}`,
    );
  }
  return res.json();
}

async function main() {
  // 1. Authenticate against Pocketbase.
  const auth = await pbFetch(
    "/api/collections/_superusers/auth-with-password",
    {
      method: "POST",
      body: JSON.stringify({
        identity: PB_ADMIN_EMAIL,
        password: PB_ADMIN_PASSWORD,
      }),
    },
  );
  const token = auth.token;

  // 2. Load the render record.
  const record = await pbFetch(
    `/api/collections/renders/records/${RENDER_RECORD_ID}`,
    {},
    token,
  );
  const paper = record.paper ?? {};
  const widthMm = Number(paper.widthMm) || 210;
  const heightMm = Number(paper.heightMm) || 297;
  console.log(
    `Rendering ${record.url} at ${widthMm}mm x ${heightMm}mm (record ${record.id})`,
  );

  const update = (body) =>
    pbFetch(
      `/api/collections/renders/records/${RENDER_RECORD_ID}`,
      { method: "PATCH", body },
      token,
    );

  await update(JSON.stringify({ status: "running", error: "" }));

  try {
    // 3. Render with Chromium. `--font-render-hinting=none` works around a
    // headless-Chromium bug where font hinting corrupts glyph advances in
    // page.pdf() output (broken letter spacing, e.g. "Tesa rekplatz").
    const browser = await chromium.launch({
      args: ["--font-render-hinting=none"],
    });
    let pdf;
    try {
      const page = await browser.newPage();
      // Allows rendering through ngrok tunnels during local development
      // (skips ngrok's browser interstitial). Harmless for other origins.
      await page.setExtraHTTPHeaders({ "ngrok-skip-browser-warning": "true" });
      const response = await page.goto(record.url, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      if (!response || !response.ok()) {
        throw new Error(
          `Print page returned HTTP ${response ? response.status() : "no response"}`,
        );
      }
      // Ensure webfonts are loaded — wrong fonts shift line breaks and break
      // fold-accurate layouts.
      await page.evaluate(() => document.fonts.ready);
      // Print-readiness contract: pages can mark elements with
      // `data-print-waiting` while client-side layout (e.g. the events-flow
      // distribution) is still settling. Wait until none remain.
      await page
        .waitForFunction(
          () => !document.querySelector("[data-print-waiting]"),
          { timeout: 30_000 },
        )
        .catch(() => {
          throw new Error(
            "Print page never became ready ([data-print-waiting] persisted)",
          );
        });
      pdf = await page.pdf({
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } finally {
      await browser.close();
    }
    console.log(`Rendered PDF: ${pdf.length} bytes`);

    // 4. Upload the PDF into the record and mark it done.
    const form = new FormData();
    form.set("status", "done");
    form.set(
      "pdf",
      new Blob([pdf], { type: "application/pdf" }),
      `render-${RENDER_RECORD_ID}.pdf`,
    );
    await update(form);
    console.log("Done.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Render failed:", message);
    await update(
      JSON.stringify({ status: "error", error: message.slice(0, 10_000) }),
    ).catch((e) => console.error("Could not write error to PB:", e));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
