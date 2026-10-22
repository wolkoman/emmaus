import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { z } from "zod";
import type { PostDescription, Category } from "./types";

const DESCRIPTIONS_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/descriptions.json";
const CATEGORIES_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/categories.json";
const USAGE_FILE = "/Users/manuel/Projects/emmaus/analysis/instagram/cache/categorize-usage.json";
const MODEL = process.env.CATEGORIZE_MODEL ?? "gpt-5";

const PRICE_INPUT_PER_MTOK = 1.25;
const PRICE_OUTPUT_PER_MTOK = 10.0;

const CategorySchema = z.object({
  id: z
    .string()
    .describe(
      "Kurze, technische ID in kebab-case (z.B. 'liturgie-sonntag', 'fastenimpuls'). Nur ASCII.",
    ),
  name: z
    .string()
    .describe("Menschenlesbarer Name der Kategorie auf Deutsch (2-4 Wörter)."),
  description: z
    .string()
    .describe(
      "1-2 Sätze Beschreibung: Was gehört in diese Kategorie? Was sind die Abgrenzungskriterien?",
    ),
  examples: z
    .array(z.string())
    .describe(
      "3-5 Post-IDs aus dem Input, die stark zu dieser Kategorie gehören.",
    ),
});

const TaxonomySchema = z.object({
  categories: z.array(CategorySchema).describe("8-14 Kategorien, nicht-überlappend"),
  rationale: z
    .string()
    .describe(
      "1-2 Absätze: Warum diese Struktur? Welche alternativen Schnitte wurden verworfen?",
    ),
});

const SYSTEM_PROMPT = `Du bist ein Analyst für Social-Media-Strategie einer katholischen Pfarrgemeinde.

Deine Aufgabe: Aus einer Sammlung von Post-Beschreibungen eine datengetriebene Taxonomie von 8-14 Content-Kategorien ableiten.

Kriterien für gute Kategorien:
- Sinnvoll aus Redaktions-Sicht (so dass man sagen kann "Wir sollten mehr/weniger davon machen")
- Nicht-überlappend: Jeder Post sollte eindeutig einer Primär-Kategorie zuordenbar sein
- Ausreichend groß: Kategorien mit 1-2 Posts lieber zusammenfassen
- Unterscheide zwischen Content-Typ (z.B. Fastenimpuls-Serie) und inhaltlichem Thema (z.B. Weihnachten)
- Kirchenjahrzeiten können relevante Kategorien sein, aber nicht allein — kombiniere mit Content-Art wenn sinnvoll
- Beachte auch den Stil/Format: "Foto mit Musik" als Reel hat anderen Charakter als echtes Video

Denk dran: Diese Kategorien werden später für Performance-Analyse genutzt — man will Antworten finden wie "Welche Art von Content bekommt am meisten Reach?"`;

interface Usage {
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
}

function loadDescriptions(): Record<string, PostDescription> {
  if (!existsSync(DESCRIPTIONS_FILE)) {
    throw new Error(`Descriptions not found at ${DESCRIPTIONS_FILE}. Run describe.ts first.`);
  }
  return JSON.parse(readFileSync(DESCRIPTIONS_FILE, "utf-8"));
}

function buildUserMessage(descriptions: Record<string, PostDescription>): string {
  const lines: string[] = [
    `Hier sind ${Object.keys(descriptions).length} Post-Beschreibungen einer katholischen Pfarrgemeinde (Emmaus am Wienerberger, Wien, letzte 12 Monate).`,
    "Für jeden Post: ID, Themes, Tonalität, und die LLM-generierte Beschreibung.",
    "",
    "Leite daraus eine Taxonomie von 8-14 Kategorien ab, die zur Performance-Analyse taugt.",
    "",
    "=== POSTS ===",
    "",
  ];

  for (const [postId, d] of Object.entries(descriptions)) {
    lines.push(
      `ID: ${postId}`,
      `Themes: ${d.themes.join(", ")}`,
      `Tone: ${d.tone} | liturgisch: ${d.hasLiturgicalContent}`,
      `Beschreibung: ${d.description}`,
      "",
    );
  }

  return lines.join("\n");
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const descriptions = loadDescriptions();
  console.log(`Loaded ${Object.keys(descriptions).length} descriptions.`);

  const client = new OpenAI();
  const userMessage = buildUserMessage(descriptions);

  console.log(`Calling ${MODEL} with reasoning_effort=medium...`);
  const completion = await client.chat.completions.parse({
    model: MODEL,
    reasoning_effort: "medium",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: zodResponseFormat(TaxonomySchema, "taxonomy"),
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) throw new Error("Failed to parse taxonomy");

  const u = completion.usage!;
  const usage: Usage = {
    promptTokens: u.prompt_tokens,
    completionTokens: u.completion_tokens,
    reasoningTokens: u.completion_tokens_details?.reasoning_tokens ?? 0,
  };

  const cost =
    (usage.promptTokens / 1_000_000) * PRICE_INPUT_PER_MTOK +
    (usage.completionTokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK;

  const dir = CATEGORIES_FILE.replace(/\/[^/]+$/, "");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(CATEGORIES_FILE, JSON.stringify(parsed, null, 2));
  writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));

  console.log(`\n=== ${parsed.categories.length} Categories ===\n`);
  for (const cat of parsed.categories) {
    console.log(`- [${cat.id}] ${cat.name} (${cat.examples.length} examples)`);
    console.log(`  ${cat.description}`);
  }
  console.log(`\nRationale:\n${parsed.rationale}\n`);
  console.log(
    `Tokens: in=${usage.promptTokens} out=${usage.completionTokens} (reasoning=${usage.reasoningTokens})`,
  );
  console.log(`Cost: $${cost.toFixed(4)}`);
  console.log(`\nWritten: ${CATEGORIES_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
