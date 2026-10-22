import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { z } from "zod";
import { loadPostsFromCsv, findImageForPost } from "./load-posts";
import type { PostDescription, InstagramPost } from "./types";

const CACHE_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/descriptions.json";
const USAGE_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/describe-usage.json";
const MODEL = process.env.DESCRIBE_MODEL ?? "gpt-5";

// gpt-5 pricing as of 2026-01 (USD per 1M tokens) — adjust if OpenAI changes pricing.
const PRICE_INPUT_PER_MTOK = 1.25;
const PRICE_CACHED_INPUT_PER_MTOK = 0.125;
const PRICE_OUTPUT_PER_MTOK = 10.0;

const DescriptionSchema = z.object({
  description: z
    .string()
    .describe(
      "Semantische Beschreibung des Posts in 2-4 Sätzen. Was zeigt das Bild? Worum geht es inhaltlich? Welche Personen, Orte, Anlässe sind sichtbar?",
    ),
  themes: z
    .array(z.string())
    .describe(
      "3-6 thematische Stichwörter, die den Post charakterisieren (z.B. 'Fastenzeit', 'Predigt', 'Gemeinschaft', 'Liturgie', 'Bibelzitat').",
    ),
  tone: z
    .string()
    .describe(
      "Tonalität in 1-3 Wörtern (z.B. 'feierlich', 'alltäglich', 'festlich', 'reflektierend', 'dankend', 'informativ').",
    ),
  hasLiturgicalContent: z
    .boolean()
    .describe(
      "Handelt es sich um liturgische Inhalte (Gottesdienst, Sakrament, Messfeier, liturgisches Fest)?",
    ),
  modelNotes: z
    .string()
    .describe(
      "Kurze Notiz wenn Bild fehlt, Caption unklar, oder etwas auffällig ist. Sonst leerer String.",
    ),
});

const SYSTEM_PROMPT = `Du bist ein Analyst für Social-Media-Content einer katholischen Pfarrgemeinde in Wien (Emmaus am Wienerberger, Erzdiözese Wien).

Deine Aufgabe: Für jeden Instagram-Post eine semantische Beschreibung erstellen, die später für Kategorisierung und Performance-Analyse genutzt wird.

Wichtig:
- Sei präzise und beobachtend. Wenn du ein Bild siehst, beschreibe was darauf zu sehen ist (Personen, Räume, Symbole, Text, Liturgische Elemente, Gegenstände).
- Wenn die Caption nur aus Hashtags besteht, versuche aus Hashtags + Bild + Datum abzuleiten, worum es geht.
- Nutze deutschen katholischen Vokabular korrekt (Fastenzeit, Advent, Eucharistie, Hl. Messe, Kar-Woche, Firmung, Erstkommunion, Pfarrfest, Sternsinger, Roratemesse, etc.).
- Sei neutral-beschreibend, nicht wertend. Keine Meinungen zu Performance hier.
- Sei sparsam mit Themes (3-6), aber spezifisch.
- Wenn kein Bild verfügbar ist, mache das explizit in modelNotes klar und arbeite nur mit Caption + Metadaten.
- Das Datum gibt oft Kontext: z.B. Dezember = Advent/Weihnachten, März/April = Fastenzeit/Ostern, Januar = Sternsinger/Dreikönig.
- "Reel-Charakter: STATISCH" bedeutet das Reel ist in Wahrheit ein Foto mit Musik unterlegt — erwähne das nicht in der Beschreibung aber lass es in die Tonalität einfließen.`;

interface UsageTotals {
  requests: number;
  failedRequests: number;
  promptTokens: number;
  cachedPromptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
}

function emptyUsage(): UsageTotals {
  return {
    requests: 0,
    failedRequests: 0,
    promptTokens: 0,
    cachedPromptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
  };
}

function loadUsage(): UsageTotals {
  if (!existsSync(USAGE_FILE)) return emptyUsage();
  return JSON.parse(readFileSync(USAGE_FILE, "utf-8"));
}

function saveUsage(u: UsageTotals) {
  const dir = USAGE_FILE.replace(/\/[^/]+$/, "");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(USAGE_FILE, JSON.stringify(u, null, 2));
}

function loadCache(): Record<string, PostDescription> {
  if (!existsSync(CACHE_FILE)) return {};
  return JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
}

function saveCache(cache: Record<string, PostDescription>) {
  const dir = CACHE_FILE.replace(/\/[^/]+$/, "");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function buildUserContent(
  post: InstagramPost,
  imagePath: string | null,
): OpenAI.Chat.Completions.ChatCompletionContentPart[] {
  const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  if (imagePath) {
    const imageData = readFileSync(imagePath).toString("base64");
    const ext = imagePath.split(".").pop()!.toLowerCase();
    const mediaType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
    parts.push({
      type: "image_url",
      image_url: {
        url: `data:${mediaType};base64,${imageData}`,
        detail: "low",
      },
    });
  }

  const cleanCaption = (post.description || "").trim() || "(keine Caption)";

  let motionLine = "";
  if (post.reelMotion) {
    motionLine = post.reelMotion.isStatic
      ? "Reel-Charakter: STATISCH (Foto mit Musik — keine Bewegung zwischen Frames)"
      : "Reel-Charakter: echtes Video (mit Bewegung, kann ruhig oder dynamisch sein)";
  }

  parts.push({
    type: "text",
    text: [
      `Post-Typ: ${post.postType}`,
      `Veröffentlicht: ${post.publishedAt}`,
      post.durationSeconds ? `Dauer: ${post.durationSeconds}s` : "",
      motionLine,
      `Permalink: ${post.permalink}`,
      "",
      "Caption:",
      cleanCaption,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return parts;
}

async function describePost(
  client: OpenAI,
  post: InstagramPost,
  imagePath: string | null,
  usage: UsageTotals,
): Promise<PostDescription> {
  const completion = await client.chat.completions.parse({
    model: MODEL,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserContent(post, imagePath) },
    ],
    response_format: zodResponseFormat(DescriptionSchema, "post_description"),
  });

  const u = completion.usage;
  if (u) {
    usage.requests++;
    usage.promptTokens += u.prompt_tokens ?? 0;
    usage.completionTokens += u.completion_tokens ?? 0;
    usage.cachedPromptTokens += u.prompt_tokens_details?.cached_tokens ?? 0;
    usage.reasoningTokens += u.completion_tokens_details?.reasoning_tokens ?? 0;
  }

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new Error(`Failed to parse description for post ${post.postId}`);
  }

  return {
    postId: post.postId,
    permalink: post.permalink,
    imagePath,
    caption: post.description,
    description: parsed.description,
    themes: parsed.themes,
    tone: parsed.tone,
    hasLiturgicalContent: parsed.hasLiturgicalContent,
    modelNotes: parsed.modelNotes,
  };
}

function computeCost(u: UsageTotals) {
  const nonCached = Math.max(0, u.promptTokens - u.cachedPromptTokens);
  const inputCost = (nonCached / 1_000_000) * PRICE_INPUT_PER_MTOK;
  const cachedCost =
    (u.cachedPromptTokens / 1_000_000) * PRICE_CACHED_INPUT_PER_MTOK;
  const outputCost = (u.completionTokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK;
  return { inputCost, cachedCost, outputCost, total: inputCost + cachedCost + outputCost };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const client = new OpenAI();
  const posts = loadPostsFromCsv();
  const cache = loadCache();
  const usage = loadUsage();

  console.log(`Model: ${MODEL}`);
  console.log(`Loaded ${posts.length} posts. Cached descriptions: ${Object.keys(cache).length}`);

  const remaining = posts.filter((p) => !cache[p.postId]);
  console.log(`To describe: ${remaining.length}\n`);

  for (let i = 0; i < remaining.length; i++) {
    const post = remaining[i];
    const imagePath = findImageForPost(post.permalink);

    try {
      const description = await describePost(client, post, imagePath, usage);
      cache[post.postId] = description;

      if ((i + 1) % 5 === 0 || i === remaining.length - 1) {
        saveCache(cache);
        saveUsage(usage);
      }

      const themesStr = description.themes.slice(0, 3).join(", ");
      const cost = computeCost(usage);
      console.log(
        `[${i + 1}/${remaining.length}] ${post.postType} ${post.date} | img=${imagePath ? "Y" : "N"} | themes=${themesStr} | $${cost.total.toFixed(3)}`,
      );
    } catch (err) {
      usage.failedRequests++;
      saveUsage(usage);
      console.error(`Failed post ${post.postId}:`, (err as Error).message);
    }
  }

  saveCache(cache);
  saveUsage(usage);

  const cost = computeCost(usage);
  console.log("\n=== Usage & Cost ===");
  console.log(`Requests:            ${usage.requests} (failed: ${usage.failedRequests})`);
  console.log(`Prompt tokens:       ${usage.promptTokens.toLocaleString()}`);
  console.log(`  Cached:            ${usage.cachedPromptTokens.toLocaleString()}`);
  console.log(`  Uncached:          ${(usage.promptTokens - usage.cachedPromptTokens).toLocaleString()}`);
  console.log(`Completion tokens:   ${usage.completionTokens.toLocaleString()}`);
  console.log(`  Reasoning tokens:  ${usage.reasoningTokens.toLocaleString()}`);
  console.log(`\nCost breakdown (${MODEL}):`);
  console.log(`  Input (uncached):  $${cost.inputCost.toFixed(4)}`);
  console.log(`  Input (cached):    $${cost.cachedCost.toFixed(4)}`);
  console.log(`  Output:            $${cost.outputCost.toFixed(4)}`);
  console.log(`  TOTAL:             $${cost.total.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
