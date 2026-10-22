import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { z } from "zod";
import type { PostDescription, Category, PostClassification } from "./types";

const DESCRIPTIONS_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/descriptions.json";
const CATEGORIES_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/categories.json";
const CLASSIFICATIONS_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/classifications.json";
const USAGE_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/classify-usage.json";
const MODEL = process.env.CLASSIFY_MODEL ?? "gpt-5";

const PRICE_INPUT_PER_MTOK = 1.25;
const PRICE_CACHED_INPUT_PER_MTOK = 0.125;
const PRICE_OUTPUT_PER_MTOK = 10.0;

const ClassificationSchema = z.object({
  primaryCategory: z.string().describe("Kategorie-ID aus der Taxonomie"),
  secondaryCategories: z
    .array(z.string())
    .describe("0-2 weitere Kategorie-IDs, wenn der Post mehrere Aspekte abdeckt"),
  confidence: z
    .number()
    .describe("Konfidenz der Primär-Zuordnung, 0.0-1.0"),
  reasoning: z.string().describe("1 Satz Begründung"),
});

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

function loadClassifications(): Record<string, PostClassification> {
  if (!existsSync(CLASSIFICATIONS_FILE)) return {};
  return JSON.parse(readFileSync(CLASSIFICATIONS_FILE, "utf-8"));
}

function saveClassifications(c: Record<string, PostClassification>) {
  const dir = CLASSIFICATIONS_FILE.replace(/\/[^/]+$/, "");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(CLASSIFICATIONS_FILE, JSON.stringify(c, null, 2));
}

function loadUsage(): UsageTotals {
  if (!existsSync(USAGE_FILE)) return emptyUsage();
  return JSON.parse(readFileSync(USAGE_FILE, "utf-8"));
}

function saveUsage(u: UsageTotals) {
  writeFileSync(USAGE_FILE, JSON.stringify(u, null, 2));
}

function buildSystemPrompt(categories: Category[]): string {
  const lines: string[] = [
    "Du ordnest Instagram-Posts einer katholischen Pfarrgemeinde in Kategorien ein.",
    "",
    "Regeln:",
    "- Gib genau EINE primaryCategory an (die ID aus der Taxonomie unten).",
    "- secondaryCategories nur wenn der Post wirklich mehrere Aspekte abdeckt — lieber weglassen als overreichen.",
    "- confidence = 0.9+ wenn eindeutig, 0.7-0.9 wenn plausibel aber mit Unschärfe, <0.7 wenn schwierig.",
    "- Nutze NUR IDs aus der Taxonomie.",
    "",
    "=== Taxonomie ===",
    "",
  ];
  for (const cat of categories) {
    lines.push(`[${cat.id}] ${cat.name}`);
    lines.push(`  ${cat.description}`);
    lines.push("");
  }
  return lines.join("\n");
}

async function classifyPost(
  client: OpenAI,
  systemPrompt: string,
  postId: string,
  description: PostDescription,
  usage: UsageTotals,
): Promise<PostClassification> {
  const userText = [
    `Post-ID: ${postId}`,
    `Themes: ${description.themes.join(", ")}`,
    `Tone: ${description.tone}`,
    `Liturgisch: ${description.hasLiturgicalContent}`,
    `Beschreibung: ${description.description}`,
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: MODEL,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText },
    ],
    response_format: zodResponseFormat(ClassificationSchema, "classification"),
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
  if (!parsed) throw new Error(`Failed to parse classification for ${postId}`);

  return {
    postId,
    primaryCategory: parsed.primaryCategory,
    secondaryCategories: parsed.secondaryCategories,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
  };
}

function computeCost(u: UsageTotals) {
  const nonCached = Math.max(0, u.promptTokens - u.cachedPromptTokens);
  return (
    (nonCached / 1_000_000) * PRICE_INPUT_PER_MTOK +
    (u.cachedPromptTokens / 1_000_000) * PRICE_CACHED_INPUT_PER_MTOK +
    (u.completionTokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK
  );
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
  if (!existsSync(DESCRIPTIONS_FILE)) throw new Error(`Missing ${DESCRIPTIONS_FILE}`);
  if (!existsSync(CATEGORIES_FILE)) throw new Error(`Missing ${CATEGORIES_FILE}`);

  const descriptions: Record<string, PostDescription> = JSON.parse(
    readFileSync(DESCRIPTIONS_FILE, "utf-8"),
  );
  const taxonomy: { categories: Category[] } = JSON.parse(
    readFileSync(CATEGORIES_FILE, "utf-8"),
  );

  const systemPrompt = buildSystemPrompt(taxonomy.categories);
  const classifications = loadClassifications();
  const usage = loadUsage();

  const postIds = Object.keys(descriptions);
  const remaining = postIds.filter((id) => !classifications[id]);

  console.log(`${postIds.length} posts, ${remaining.length} to classify`);
  console.log(`${taxonomy.categories.length} categories\n`);

  const client = new OpenAI();

  for (let i = 0; i < remaining.length; i++) {
    const postId = remaining[i];
    try {
      const c = await classifyPost(
        client,
        systemPrompt,
        postId,
        descriptions[postId],
        usage,
      );
      classifications[postId] = c;

      if ((i + 1) % 10 === 0 || i === remaining.length - 1) {
        saveClassifications(classifications);
        saveUsage(usage);
      }

      const cost = computeCost(usage);
      console.log(
        `[${i + 1}/${remaining.length}] ${c.primaryCategory} (conf=${c.confidence.toFixed(2)}) $${cost.toFixed(3)}`,
      );
    } catch (err) {
      usage.failedRequests++;
      saveUsage(usage);
      console.error(`Failed ${postId}:`, (err as Error).message);
    }
  }

  saveClassifications(classifications);
  saveUsage(usage);

  const cost = computeCost(usage);
  console.log("\n=== Usage & Cost ===");
  console.log(`Requests:          ${usage.requests} (failed: ${usage.failedRequests})`);
  console.log(`Prompt tokens:     ${usage.promptTokens.toLocaleString()} (cached: ${usage.cachedPromptTokens.toLocaleString()})`);
  console.log(`Completion tokens: ${usage.completionTokens.toLocaleString()} (reasoning: ${usage.reasoningTokens.toLocaleString()})`);
  console.log(`TOTAL:             $${cost.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
