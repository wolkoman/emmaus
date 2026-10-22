import { readFileSync } from "node:fs";

const PROD_URL = "https://db.emmaus.wien";
const PROD_TUNNEL_URL = "http://localhost:8091";
const LOCAL_URL = "http://localhost:8090";

function readEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split("\n")
        .map((line) => line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/))
        .filter(Boolean)
        .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, "")]),
    );
  } catch {
    return {};
  }
}

const env = {
  ...readEnvFile(".env"),
  ...readEnvFile(".env.local"),
  ...process.env,
};
const pbUrl = (env.POCKETBASE_URL ?? "").replace(/\/$/, "");

async function isHealthy(url) {
  try {
    const res = await fetch(`${url}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

if (!pbUrl) {
  console.log("[pb] POCKETBASE_URL not set — skipping Pocketbase check.");
  process.exit(0);
}

if (await isHealthy(pbUrl)) {
  console.log(`[pb] Pocketbase reachable at ${pbUrl}.`);
  if (pbUrl === PROD_URL || pbUrl === PROD_TUNNEL_URL) {
    console.log("[pb] NOTE: you are working against PRODUCTION data.");
  }
  process.exit(0);
}

if (pbUrl === LOCAL_URL) {
  console.warn(
    `[pb] WARNING: local Pocketbase at ${pbUrl} is down — run \`bun pb:local\` ` +
      "(and `bun pb:seed` for fixtures).",
  );
} else if (pbUrl === PROD_TUNNEL_URL) {
  console.warn(
    `[pb] WARNING: prod tunnel at ${pbUrl} is down — run ` +
      "`bun pb:prod:tunnel` explicitly, or use https://db.emmaus.wien.",
  );
} else {
  console.warn(`[pb] WARNING: Pocketbase at ${pbUrl} is not reachable.`);
}
