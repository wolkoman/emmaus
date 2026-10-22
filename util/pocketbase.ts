import PocketBase from "pocketbase";
import type { TypedPocketBase } from "@/pb/pocketbase-types";

/**
 * Server-side Pocketbase client for the api deployment.
 *
 * Auth model: trusted-client. The api holds a superuser password via
 * `PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD` and authorizes every request at the
 * Next.js layer (same pattern used for Cockpit today). PB's own collection
 * rules are left locked to superusers-only.
 *
 * This client is ONLY safe to use from server components, server actions, and
 * API route handlers. Never import it from client components — it would leak
 * the admin credentials into the browser bundle.
 */

const PB_URL = process.env.POCKETBASE_URL;
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

// The cached client is reused for the lifetime of the server process.
// Superuser tokens are valid for ~14 days and processes (Vercel lambdas,
// build workers) live far shorter, so no time-based refresh is needed.
// Deliberately NO Date.now() here: Next.js prerendering forbids reading
// the clock before uncached IO, and pb() is often the first data access
// on a page. On auth errors (e.g. token invalidated by a password
// rotation) the cache is cleared so the next call re-authenticates.
declare global {
  // eslint-disable-next-line no-var
  var __emmausPb: TypedPocketBase | undefined;
}

async function getAuthedClient(): Promise<TypedPocketBase> {
  // Checked lazily (not at module load) so the app can still boot with the
  // Cockpit backend when no Pocketbase env is configured.
  if (!PB_URL) {
    throw new Error(
      "POCKETBASE_URL is not set. In prod it should be https://db.emmaus.wien; " +
        "locally it should be http://localhost:8090 (see pb/docker-compose.yml).",
    );
  }

  const existing = globalThis.__emmausPb;
  if (existing) return existing;

  const client = new PocketBase(PB_URL) as TypedPocketBase;
  // Don't auto-cancel in-flight requests — server-side, each call is independent
  // and the default behavior of aborting previous requests is SDK client-oriented.
  client.autoCancellation(false);

  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    throw new Error(
      "PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD must be set for the api to " +
        "authenticate against Pocketbase.",
    );
  }

  try {
    await client
      .collection("_superusers")
      .authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
  } catch (err) {
    if (isConnectionError(err)) {
      throw new Error(
        `Pocketbase is unreachable at ${PB_URL}. ` +
          (PB_URL?.includes(":8091")
            ? "The prod tunnel isn't running — start it with `bun pb:prod:tunnel`."
            : PB_URL?.includes(":8090")
              ? "The local instance isn't running — start it with `bun pb:local`."
              : "Check that the instance is up and POCKETBASE_URL is correct."),
      );
    }
    throw err;
  }

  // If the token is ever rejected (e.g. superuser password rotated and
  // tokenKey invalidated), drop the cached client so the next pb() call
  // re-authenticates instead of failing forever.
  client.afterSend = (response, data) => {
    if (response.status === 401 || response.status === 403) {
      globalThis.__emmausPb = undefined;
    }
    return data;
  };

  globalThis.__emmausPb = client;
  return client;
}

/**
 * Authenticate against the PB `_superusers` collection (admin accounts —
 * the same accounts that access the PB dashboard). Uses a throwaway client
 * so the shared superuser client's auth state is never touched. Returns the
 * superuser record, or null for wrong credentials.
 */
export async function pbAuthSuperuser(identity: string, password: string) {
  if (!PB_URL) throw new Error("POCKETBASE_URL is not set.");
  const client = new PocketBase(PB_URL) as TypedPocketBase;
  client.autoCancellation(false);
  try {
    const res = await client
      .collection("_superusers")
      .authWithPassword(identity, password);
    return res.record;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err.status === 400 || err.status === 404)
    ) {
      return null; // invalid credentials / unknown identity
    }
    throw err;
  }
}

function isConnectionError(err: unknown): boolean {
  // The PB SDK wraps network failures in ClientResponseError with status 0.
  return (
    !!err &&
    typeof err === "object" &&
    (("status" in err && err.status === 0) ||
      ("originalError" in err && err.originalError instanceof TypeError))
  );
}

export function pb(): Promise<TypedPocketBase> {
  return getAuthedClient();
}
