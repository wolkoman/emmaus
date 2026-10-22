// Checks PocketBase, exposes localhost:3000 through ngrok when needed, then starts Next.js.
import { execFileSync, spawn } from "node:child_process";
import { openSync, readFileSync } from "node:fs";

const NGROK_API = "http://127.0.0.1:4040/api/tunnels";
const NGROK_LOG = ".ngrok.log";
const PORT = "3000";

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

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };

async function ngrokUrlForPort(port) {
  try {
    const res = await fetch(NGROK_API, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return undefined;
    const { tunnels } = await res.json();
    return tunnels?.find(
      (t) => t.proto === "https" && t.config?.addr?.endsWith(`:${port}`),
    )?.public_url;
  } catch {
    return undefined;
  }
}

/** Agents from earlier `bun dev` runs are detached, so they outlive it. */
function killUselessNgrokAgents() {
  try {
    execFileSync("pkill", ["-f", `ngrok http ${PORT}`], { stdio: "ignore" });
    console.log("[ngrok] Removed leftover agent(s) without a live tunnel.");
  } catch {
    // pkill exits non-zero when nothing matched — nothing to clean up.
  }
}

async function ensureNgrok() {
  const existing = await ngrokUrlForPort(PORT);
  if (existing) {
    console.log(`[ngrok] Reusing tunnel ${existing} -> :${PORT}.`);
    return existing;
  }
  killUselessNgrokAgents();
  console.log(`[ngrok] Starting tunnel to :${PORT} (log: ${NGROK_LOG}) ...`);
  // Truncate: the log is only interesting for the current run.
  const log = openSync(NGROK_LOG, "w");
  const child = spawn("ngrok", ["http", PORT, "--log", "stdout"], {
    detached: true,
    stdio: ["ignore", log, log],
  });
  child.unref();
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const url = await ngrokUrlForPort(PORT);
    if (url) {
      console.log(`[ngrok] Tunnel up: ${url} -> :${PORT}.`);
      return url;
    }
  }
  // Leaving it running would block the next attempt from taking over :4040.
  child.kill();
  console.warn(
    `[ngrok] WARNING: tunnel did not come up (check ${NGROK_LOG}; is ngrok ` +
      "installed and authed?). Dev starts anyway, but PDF rendering needs a " +
      "public URL: retry, or set NEXT_PUBLIC_SITE_URL in .env.local to skip " +
      "ngrok entirely.",
  );
  return undefined;
}

// Check PocketBase without starting a tunnel.
await new Promise((resolve) => {
  const pb = spawn("node", ["scripts/check-pocketbase.mjs"], {
    stdio: "inherit",
  });
  pb.on("exit", resolve);
  pb.on("error", resolve);
});

// Resolve a public site origin for render jobs.
let siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? fileEnv.NEXT_PUBLIC_SITE_URL;
if (siteUrl) {
  console.log(`[dev] NEXT_PUBLIC_SITE_URL already set (${siteUrl}).`);
} else {
  siteUrl = await ensureNgrok();
}

// Start Next.js with the resolved environment.
const child = spawn("bun", ["x", "next", "dev", "--turbopack"], {
  stdio: "inherit",
  env: {
    ...process.env,
    ...(siteUrl ? { NEXT_PUBLIC_SITE_URL: siteUrl } : {}),
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
