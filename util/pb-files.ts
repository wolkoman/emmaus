/**
 * Public URL for a file stored in a Pocketbase file field.
 *
 * PB serves files at `/api/files/{collection}/{recordId}/{filename}`. Files
 * are publicly readable regardless of the collection's (superuser-locked)
 * API rules, as long as the file field isn't marked "protected" — which none
 * of ours are.
 *
 * Base URL resolution: `PB_PUBLIC_URL` if set, otherwise `POCKETBASE_URL`.
 * The latter is already browser-reachable in every real deployment (Vercel
 * uses https://db.emmaus.wien, local dev uses http://localhost:8090); the
 * override exists for setups where the API talks to PB through a private
 * address.
 */
const base = (
  process.env.PB_PUBLIC_URL ??
  process.env.POCKETBASE_URL ??
  ""
).replace(/\/$/, "");

export function pbFileUrl(
  collection: string,
  recordId: string,
  filename: string,
): string {
  if (!filename) return "";
  return `${base}/api/files/${collection}/${recordId}/${encodeURIComponent(filename)}`;
}
