/**
 * Livestream server: the shared state of overlays and camera pages, kept in
 * sync with every page over WebSockets and with OBS, plus the crew chat.
 * See ../README.md.
 */
import { defaultBroadcastTime, defaultResumeTime } from "../content/prelive";
import { READING_SETS, READINGS } from "../content/readings";
import type { ServerWebSocket } from "bun";
import { createChat } from "./chat";
import { networkInterfaces } from "node:os";
import { ACCESS_KEY, createHttpHandler, overlayPages, type SocketData } from "./http";
import { connectObs } from "./obs";
import { decode, encode, type ClientMessage } from "./protocol";
import { choice, createStore, text, time, type Patch } from "./store";

const PORT = Number(process.env.PORT ?? 4321);
const HOST = process.env.HOST ?? "127.0.0.1";

/** The OBS scene behind each value of `obs.scene`. */
const OBS_SCENES: Record<string, string> = { prelive: "Pre-Live", live: "Live" };
/** Each camera has a page at /camera/<n> and joins the chat as cam<n>. */
const CAMERAS = ["cam1", "cam2", "cam3", "cam4"];
/** Cue numbers: "0" is the Bible reference alone, then "1" (the announcement) to the end of the longest reading. */
const CUES = Array.from({ length: Math.max(...Object.values(READINGS).map(({ cues }) => cues.length)) + 1 }, (_, i) => `${i}`);
/** The control page joins the chat as `director`. */
const CHAT_CLIENTS = ["director", ...CAMERAS];

const store = createStore({
  obs: {
    scene: choice(Object.keys(OBS_SCENES)),
    connection: choice(["offline", "online"], { readOnly: true }),
  },
  /** `banner` is the lower third; its texts are in the live overlay page. `reading` shows subtitles, one `cue` at a time. */
  live: {
    mode: choice(["off", "on"]),
    banner: choice(["off", "priest", "mother"]),
    reading: choice(["off", "first", "gospel"]),
    cue: choice(CUES, { readOnly: true }),
    step: choice(["prev", "next"], { action: true }),
    /** During communion over b-roll: the spiritual communion prayer, then a word of Carlo Acutis. */
    communion: choice(["off", "prayer", "carlo"]),
  },
  /** `screen`: before the Mass (countdown to `startTime`), a pause (countdown to `resumeTime`) or the end. */
  /** Which texts the readings use: the Carlo Acutis Mass, or the test Mass on 15 November. */
  readings: { set: choice(Object.keys(READING_SETS)) },
  prelive: {
    screen: choice(["before", "pause", "end"]),
    startTime: time(defaultBroadcastTime()),
    resumeTime: time(defaultResumeTime()),
    trailer: choice(["off", "play"]),
    /** Background music (public/media/music.mp3), looped; it gives way while the trailer plays. */
    music: choice(["off", "play"]),
  },
  /** Operator names, shown in the chat and usable as @name. */
  cameras: Object.fromEntries(CAMERAS.map((cam) => [cam, text()])),
  /** Set by hand for now; the ATEM integration will own these. */
  tally: Object.fromEntries(CAMERAS.map((cam) => [cam, choice(["off", "preview", "program"])])),
});

// --- OBS ---

const obs = connectObs({
  url: process.env.OBS_WEBSOCKET_URL ?? "ws://127.0.0.1:4455",
  password: process.env.OBS_WEBSOCKET_PASSWORD ?? "",
  onConnected: (connected) => store.apply("obs", { connection: connected ? "online" : "offline" }),
  onScene: (sceneName) => {
    const scene = Object.keys(OBS_SCENES).find((key) => OBS_SCENES[key] === sceneName);
    if (scene) sceneChanged(scene);
    else console.warn(`OBS is on "${sceneName}", which is not in OBS_SCENES; obs.scene keeps its value`);
  },
});

function sceneChanged(scene: string) {
  store.apply("obs", { scene });
  if (scene === "live") store.apply("prelive", { trailer: "off", music: "off" });
}

// --- Banner ---

/** A lower third only introduces a person, so it hides itself after this long: each of its four role languages once (ROLE_MS in live.html). */
const BANNER_MS = 12000;
let bannerTimer: ReturnType<typeof setTimeout> | undefined;
let banner = store.state.live.banner;

store.subscribe((state) => {
  if (state.live.banner === banner) return;
  banner = state.live.banner;
  clearTimeout(bannerTimer);
  if (banner !== "off") bannerTimer = setTimeout(() => store.apply("live", { banner: "off" }), BANNER_MS);
});

// --- Changes from clients ---

/** Fields an outside system owns: a change is requested from it, and the state follows once it has happened. */
const OWNED_FIELDS: Record<string, (value: string) => Promise<void>> = {
  "obs.scene": async (scene) => {
    await obs.setScene(OBS_SCENES[scene]); // resolves when the transition has started
    sceneChanged(scene);
  },
  // Choosing a reading (again, e.g. for the gospel's second language) starts it at its Bible reference.
  "live.reading": async (reading) => store.apply("live", { reading, cue: "0" }),
  // Switching between the real and the test texts never swaps a reading on screen.
  "readings.set": async (set) => {
    store.apply("live", { reading: "off" });
    store.apply("readings", { set });
  },
  // Next after the last cue hides the subtitles; prev stops at the reference.
  "live.step": async (step) => {
    const { reading, cue } = store.state.live;
    if (reading === "off") throw new Error("no reading is shown");
    const next = Number(cue) + (step === "next" ? 1 : -1);
    const { set } = store.state.readings;
    const { cues } = READINGS[READING_SETS[set as keyof typeof READING_SETS][reading as "first" | "gospel"]];
    if (next > cues.length) store.apply("live", { reading: "off" });
    else store.apply("live", { cue: `${Math.max(next, 0)}` });
  },
};

/** Applies a client's change; returns an error message if it was rejected. */
async function set(section: string, patch: unknown): Promise<string | null> {
  const error = store.validate(section, patch);
  if (error) return error;

  const direct: Patch = {};
  for (const [name, value] of Object.entries(patch as Patch)) {
    const owner = OWNED_FIELDS[`${section}.${name}`];
    if (!owner) {
      direct[name] = value;
      continue;
    }
    try {
      await owner(value);
    } catch (error) {
      return (error as Error).message;
    }
  }
  if (Object.keys(direct).length > 0) store.apply(section, direct);
  return null;
}

// --- Chat ---

const chat = createChat({
  onMessage: (message) => server.publish("chat", encode({ type: "chatMessage", message })),
  onUpdate: (message) => server.publish("chat", encode({ type: "chatUpdate", message })),
  onTyping: (clients) => server.publish("chat", encode({ type: "typing", clients })),
});

// --- Program picture ---

/** A small, low-rate snapshot of the program for the camera pages; OBS is only asked while someone watches. */
const PICTURE = { intervalMs: 1000, width: 640, height: 360, quality: 50 };
const PICTURE_TOPIC = "program-picture";
let takingPicture = false;

setInterval(async () => {
  const watched = server.subscriberCount(PICTURE_TOPIC) > 0;
  if (!watched || takingPicture || store.state.obs.connection !== "online") return;
  takingPicture = true;
  try {
    const image = await obs.programSnapshot(PICTURE);
    server.publish(PICTURE_TOPIC, encode({ type: "programPicture", image, at: Date.now() }));
  } catch {
    // OBS is switching or reconnecting; the next tick tries again.
  } finally {
    takingPicture = false;
  }
}, PICTURE.intervalMs);

// --- Messages from pages ---

/** Handles one WebSocket message; returns an error message if it was rejected. */
async function receive(ws: ServerWebSocket<SocketData>, message: ClientMessage): Promise<string | null> {
  const { client } = ws.data;
  if (message.type === "set") return set(message.section, message.patch);
  if (!client) return "join the chat with /ws?client=<id> first";
  switch (message.type) {
    case "chat":
      return chat.post(client, message.text);
    case "ask":
      if (client !== "director") return "only the director can ask questions";
      if (!message.to.every((id) => CAMERAS.includes(id))) return `questions go to: ${CAMERAS.join(", ")}`;
      return chat.ask(client, message.text, message.to, message.options);
    case "answer":
      return chat.answer(client, message.id, message.option);
    case "typing":
      chat.setTyping(client, message.typing);
      return null;
    case "programPicture":
      if (message.enabled) ws.subscribe(PICTURE_TOPIC);
      else ws.unsubscribe(PICTURE_TOPIC);
      return null;
  }
}

// --- Server ---

const server = Bun.serve<SocketData, never>({
  port: PORT,
  hostname: HOST,
  fetch: createHttpHandler({ store, set, chatClients: CHAT_CLIENTS }),
  websocket: {
    open(ws) {
      ws.subscribe("state");
      ws.send(encode({ type: "state", state: store.state }));
      if (!ws.data.client) return;
      ws.subscribe("chat");
      ws.send(encode({ type: "chatHistory", messages: chat.history() }));
      ws.send(encode({ type: "typing", clients: chat.typing() }));
    },
    async message(ws, raw) {
      const message = decode(String(raw));
      const error = typeof message === "string" ? message : await receive(ws, message);
      if (error) ws.send(encode({ type: "error", error }));
    },
    close(ws) {
      if (ws.data.client) chat.setTyping(ws.data.client, false);
    },
  },
});

store.subscribe((state) => server.publish("state", encode({ type: "state", state })));

// --- Startup ---

const local = `http://localhost:${PORT}`;
console.log(`Livestream server on port ${PORT}\n`);
console.log("On this Mac:");
console.log(`  control page: ${local}/control`);
for (const name of overlayPages) console.log(`  overlay ${name}: ${local}/overlay/${name}`);

console.log("\nFor phones (open once, then pick the camera and bookmark it):");
// Physical interfaces (en0, en1, …) first; the rest are usually VPNs or virtual networks (Docker, OrbStack).
const lanAddresses = Object.entries(networkInterfaces())
  .flatMap(([name, addresses]) => (addresses ?? []).map((address) => ({ name, ...address })))
  .filter((address) => address.family === "IPv4" && !address.internal)
  .sort((a, b) => Number(!a.name.startsWith("en")) - Number(!b.name.startsWith("en")));
if (HOST === "127.0.0.1" || HOST === "localhost") {
  console.log("  not reachable: set HOST=0.0.0.0 and ACCESS_KEY in .env.local");
} else if (!ACCESS_KEY) {
  console.log("  refused until ACCESS_KEY is set in .env.local");
} else if (lanAddresses.length === 0) {
  console.log("  no network found: is the Mac on Wi-Fi or Ethernet?");
} else {
  for (const { name, address } of lanAddresses) {
    console.log(`  http://${address}:${PORT}/?key=${encodeURIComponent(ACCESS_KEY)}   (${name})`);
  }
}
