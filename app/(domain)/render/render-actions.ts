"use server";

import { getRender, requestPdfRender } from "@/app/(domain)/render/render-job";
import type {
  PaperOptions,
  RenderRecord,
} from "@/app/(domain)/render/render-repo";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { CpPersonCompetences } from "@/util/cockpit.generated";

/**
 * Server actions for requesting PDF renders from the editor UI
 * (see docs/pdf-render-jobs.md).
 *
 * Usage pattern in an editor component:
 *
 *   const { id } = await startPdfRender("/monatsblatt/print/xyz", {
 *     widthMm: 297, heightMm: 210,
 *   });
 *   // then poll pollPdfRender(id) every ~2s until status is "done"/"error"
 *   // and offer record.pdfUrl as the download link.
 */

/** Origin used to resolve relative print paths into cluster-reachable URLs. */
function publicOrigin(): string {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);
  if (!origin) {
    // Only reachable locally: the render job runs in the cluster and fetches
    // the print route over the network, so it needs a publicly reachable URL
    // of *this* instance. `bun dev` provisions one via ngrok (scripts/dev.mjs).
    throw new Error(
      "NEXT_PUBLIC_SITE_URL ist nicht gesetzt — der Render-Job im Cluster " +
        "braucht eine öffentlich erreichbare URL dieser Instanz. Lokal " +
        "startet `bun dev` dafür einen ngrok-Tunnel: Dev-Server neu starten " +
        "(siehe .ngrok.log) oder NEXT_PUBLIC_SITE_URL in .env.local setzen. " +
        "Als Ausweg die Druckansicht im Browser drucken.",
    );
  }
  return origin.replace(/\/$/, "");
}

async function assertEditor(): Promise<void> {
  const person = await resolveUserFromServer();
  if (!person?.competences.includes(CpPersonCompetences.WeeklyEditor)) {
    throw new Error("No authorization");
  }
}

/**
 * Kick off a PDF render of a print route (e.g. "/monatsblatt/print/xyz").
 * Returns the pending render record; poll with `pollPdfRender`.
 */
export async function startPdfRender(
  printPath: string,
  paper: PaperOptions,
): Promise<RenderRecord> {
  await assertEditor();
  if (!printPath.startsWith("/")) {
    throw new Error("printPath must be a relative path starting with /");
  }
  return requestPdfRender(`${publicOrigin()}${printPath}`, paper);
}

export async function pollPdfRender(id: string): Promise<RenderRecord> {
  await assertEditor();
  return getRender(id);
}
