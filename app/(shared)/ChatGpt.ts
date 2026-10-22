import { pb } from "@/util/pocketbase";

async function readCache(key: string): Promise<string | undefined> {
  const client = await pb();
  const hits = await client
    .collection("cache")
    .getList(1, 1, { filter: client.filter("key = {:key}", { key }) });
  return hits.items[0]?.value;
}

async function writeCache(key: string, value: string): Promise<void> {
  const client = await pb();
  const existing = await client
    .collection("cache")
    .getList(1, 1, { filter: client.filter("key = {:key}", { key }) });
  if (existing.items[0]) {
    await client.collection("cache").update(existing.items[0].id, { value });
  } else {
    await client.collection("cache").create({ key, value });
  }
}

async function getCachedPrompt(prompt: string): Promise<string> {
  const cached = await readCache(prompt);
  if (cached !== undefined) return cached;
  console.log("ASK CHATGPT");

  const value = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Request failed");
      return response.json();
    })
    .then((response) => response.choices[0].message.content);

  await writeCache(prompt, value);
  return value;
}

export async function getCrosswordCandidates(
  sources: string[],
): Promise<string> {
  return getCachedPrompt(
    "CROSSWORD_CANDIDATES_V4\n\n" +
      "Erzeuge aus den Themen dieser Pfarrankündigungen 10 Kreuzworträtsel-" +
      "Kandidaten. Antworten: ein thematisch passendes Wort, 3–16 Buchstaben, " +
      "nur A-Z/Ä/Ö/Ü, keine Zahlen oder Kontaktdaten. Hinweise: kurze, " +
      "verständliche Umschreibungen aus mehreren Wörtern, durch die die Antwort " +
      "gut auffindbar ist; keine ganzen Sätze und die Antwort nicht nennen. " +
      "Bevorzuge gemeinsame Buchstaben für ein zusammenhängendes Gitter. " +
      "Antworte nur mit JSON ohne Markdown: " +
      '{"candidates":[{"answer":"WORT","clue":"Kurzinfo"}]}.\n\n' +
      JSON.stringify(sources),
  );
}

function trimString(value: string) {
  const trimable = '" .\n#';
  const start = value.split("").findIndex((c) => trimable.indexOf(c) === -1);
  const end = value
    .split("")
    .reverse()
    .findIndex((c) => trimable.indexOf(c) === -1);
  return value.substring(start, value.length - end);
}

export async function getWeeklyTitle(description: string) {
  const value = await getCachedPrompt(
    "Formuliere einen kurzen Titel. Antworte nur mit dem kurzen Titel: " +
      description,
  );
  return trimString(value);
}

export async function summarizeArticle(content: string) {
  const value = await getCachedPrompt(
    "Erstelle eine spannende Vorschau in genau einem Satz, die Interesse weckt und neugierig macht. Antworte nur mit dem Vorschausatz (reiner Text, kein HTML): " +
      content,
  );
  return trimString(value);
}
