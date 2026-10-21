/** HTTP: the pages and files the browsers load, and a small JSON API (also used by the Stream Deck). */
import type { Server } from "bun";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { preliveContent } from "../content/prelive";
import type { Store } from "./store";

const PUBLIC_DIR = join(import.meta.dir, "../public");
const FONT_DIR = join(import.meta.dir, "../../node_modules/@fontsource/source-sans-3/files");
const LOGO = join(import.meta.dir, "../../public/logo.svg");
export const ACCESS_KEY = process.env.ACCESS_KEY ?? "";
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Names of the pages in public/overlays, each served at /overlay/<name>. */
export const overlayPages = readdirSync(join(PUBLIC_DIR, "overlays"))
  .filter((name) => name.endsWith(".html"))
  .map((name) => name.slice(0, -".html".length));

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors });
}

async function file(path: string) {
  const f = Bun.file(path);
  return (await f.exists()) ? new Response(f) : new Response("Not found", { status: 404 });
}

function cookie(req: Request, name: string) {
  const pair = req.headers.get("cookie")?.split("; ").find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

/**
 * The Mac itself (OBS, Stream Deck) needs nothing. Other devices need ACCESS_KEY:
 * once as ?key=… on a page (a cookie keeps it), or on every API call.
 * Returns a response to send instead, or null to continue.
 */
function checkAccess(req: Request, server: Server, url: URL): Response | null {
  if (LOOPBACK.has(server.requestIP(req)?.address ?? "")) return null;
  if (!ACCESS_KEY) return new Response("Other devices need ACCESS_KEY to be set on the server", { status: 403 });
  if (url.searchParams.get("key") === ACCESS_KEY) {
    url.searchParams.delete("key");
    if (url.pathname.startsWith("/api/") || url.pathname === "/ws") return null;
    const headers = {
      Location: url.pathname + url.search,
      "Set-Cookie": `key=${encodeURIComponent(ACCESS_KEY)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`,
    };
    return new Response(null, { status: 302, headers });
  }
  return cookie(req, "key") === ACCESS_KEY ? null : new Response("Forbidden", { status: 403 });
}

/** What a WebSocket connection knows about its client. */
export type SocketData = { client: string | null };

type Deps = {
  store: Store;
  set: (section: string, patch: unknown) => Promise<string | null>;
  /** Ids a page may join the chat as (`/ws?client=<id>`). */
  chatClients: string[];
};

export function createHttpHandler({ store, set, chatClients }: Deps) {
  return async function fetch(req: Request, server: Server): Promise<Response | undefined> {
    const url = new URL(req.url);
    const path = url.pathname;
    let match: RegExpMatchArray | null;

    const denied = checkAccess(req, server, url);
    if (denied) return denied;

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (path === "/ws") {
      const origin = req.headers.get("origin");
      if (origin && new URL(origin).host !== url.host) return new Response("Forbidden", { status: 403 });
      const client = url.searchParams.get("client");
      const data: SocketData = { client: client && chatClients.includes(client) ? client : null };
      return server.upgrade(req, { data }) ? undefined : new Response("Expected WebSocket", { status: 400 });
    }

    // Pages and assets
    if (path === "/") return file(join(PUBLIC_DIR, "index.html"));
    if (path === "/control") return file(join(PUBLIC_DIR, "control.html"));
    if ((match = path.match(/^\/camera\/(\d+)$/)) && chatClients.includes(`cam${match[1]}`)) {
      return file(join(PUBLIC_DIR, "camera.html"));
    }
    if ((match = path.match(/^\/overlay\/([a-z0-9-]+)$/))) return file(join(PUBLIC_DIR, "overlays", `${match[1]}.html`));
    if ((match = path.match(/^\/([a-z-]+\.js)$/))) return file(join(PUBLIC_DIR, match[1]));
    if ((match = path.match(/^\/media\/([a-z0-9-]+\.mp4)$/))) return file(join(PUBLIC_DIR, "media", match[1]));
    if ((match = path.match(/^\/fonts\/(source-sans-3-[a-z0-9-]+\.woff2)$/))) return file(join(FONT_DIR, match[1]));
    if (path === "/logo.svg") return file(LOGO);

    // API
    if (path === "/api/state") return json({ schema: store.schema, state: store.state, overlays: overlayPages });
    if (path === "/api/content/prelive") return json(preliveContent());
    // GET with query parameters is what a Stream Deck "Website" button can send.
    if ((match = path.match(/^\/api\/([a-z0-9-]+)\/set$/)) && (req.method === "GET" || req.method === "POST")) {
      const isJson = req.method === "POST" && req.headers.get("content-type")?.includes("application/json");
      const patch = isJson ? await req.json().catch(() => null) : Object.fromEntries(url.searchParams);
      const error = await set(match[1], patch);
      return error ? json({ error }, 400) : json({ state: store.state });
    }

    return new Response("Not found", { status: 404 });
  };
}
