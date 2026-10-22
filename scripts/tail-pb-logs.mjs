/**
 * Print the most recent Pocketbase request logs (from PB's internal logs DB).
 * Useful for verifying traffic reaches PB, e.g. after a backend cutover.
 *
 * Run: node scripts/tail-pb-logs.mjs [urlOverride]
 * Uses PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD from .env; defaults to the public
 * prod URL.
 */
import "dotenv/config";

const url = process.argv[2] ?? "https://db.emmaus.wien";

const auth = await fetch(
  `${url}/api/collections/_superusers/auth-with-password`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: process.env.PB_ADMIN_EMAIL,
      password: process.env.PB_ADMIN_PASSWORD,
    }),
  },
);
if (!auth.ok) {
  console.error(`auth failed: ${auth.status}`);
  process.exit(1);
}
const { token } = await auth.json();

const res = await fetch(`${url}/api/logs?perPage=20&sort=-created`, {
  headers: { Authorization: token },
});
const body = await res.json();
if (!Array.isArray(body.items)) {
  console.error(`unexpected response (${res.status}):`, JSON.stringify(body));
  process.exit(1);
}
for (const l of body.items) {
  const d = l.data ?? {};
  console.log(
    `${l.created}  ${d.status ?? "-"}  ${(d.method ?? "-").padEnd(6)} ` +
      `${(d.url ?? "").slice(0, 70).padEnd(70)} ${d.remoteIP ?? ""}`,
  );
}
