"use server";

import {
  fetchMonthlyByName as repoFetchByName,
  fetchMonthlySpans,
  setMonthlyPublication,
  upsertMonthlyRecord,
  type MonthlyPublication,
} from "@/app/(domain)/monthly/monthly-repo";
import { startPdfRender } from "@/app/(domain)/render/render-actions";
import type { RenderRecord } from "@/app/(domain)/render/render-repo";
import { layoutPrintJob, type MonthlyLayout } from "@/app/monatsblatt/poster";
import {
  normalizeTypography,
  sanitizeLetterHtml,
} from "@/app/monatsblatt/letter";
import {
  normalizeCrosswordAnswer,
  type CrosswordAnnouncement,
  type CrosswordEntry,
} from "@/app/monatsblatt/crossword";
import {
  fetchPapalIntention,
  PapalIntention,
} from "@/app/(domain)/monthly/papal-intentions-repo";
import { getCrosswordCandidates } from "@/app/(shared)/ChatGpt";
import { resolveUserFromServer } from "@/app/(shared)/UserHandler";
import { pb } from "@/util/pocketbase";
import { pbFileUrl } from "@/util/pb-files";
import { CpPersonCompetences } from "@/util/cockpit.generated";
import { revalidateTag } from "next/cache";
import sanitize from "sanitize-html";
import { z } from "zod";

/** Server actions for the Monatsblatt editor. */

async function assertEditor(): Promise<void> {
  const person = await resolveUserFromServer();
  if (!person?.competences.includes(CpPersonCompetences.WeeklyEditor)) {
    throw new Error("No authorization");
  }
}

export async function upsertMonthly(
  name: string,
  month: string,
  data: unknown,
): Promise<void> {
  await assertEditor();
  await upsertMonthlyRecord({ name, month, data });
  revalidateTag("monthly", "hours");
}

export async function fetchMonthlyVersions(): Promise<
  { name: string; month: string; publishedAt: string }[]
> {
  await assertEditor();
  return (await fetchMonthlySpans()).map(({ name, month, publishedAt }) => ({
    name,
    month,
    publishedAt: publishedAt ?? "",
  }));
}

/**
 * Publication step 1: render the layouts of a saved issue (flyer, A3 poster
 * and, if the issue has one, the Einlage). The render pods fetch the print
 * routes over the network, so the issue must already be saved — the editor's
 * "Veröffentlichen" saves first.
 *
 * Returns the pending render records; the caller polls them
 * (`pollPdfRender`) and finishes with `completeMonthlyPublication`. Rendering
 * is not awaited here on purpose: a job takes tens of seconds, well beyond
 * what a serverless function should hold open (docs/pdf-render-jobs.md).
 */
export async function startMonthlyRenders(
  name: string,
  withInsert: boolean,
): Promise<{
  flyer: RenderRecord;
  poster: RenderRecord;
  insert: RenderRecord | null;
}> {
  await assertEditor();
  const render = (layout: MonthlyLayout) => {
    const { path, widthMm, heightMm } = layoutPrintJob(layout, name);
    return startPdfRender(path, { widthMm, heightMm });
  };
  const [flyer, poster, insert] = await Promise.all([
    render("flyer"),
    render("poster"),
    withInsert ? render("insert") : null,
  ]);
  return { flyer, poster, insert };
}

/**
 * Publication step 2: store the finished PDFs on the issue and stamp the
 * generation date. Only called once all renders succeeded, so a failed run
 * leaves the previous publication (and its links) intact.
 */
export async function completeMonthlyPublication(
  name: string,
  pdfs: Omit<MonthlyPublication, "publishedAt">,
): Promise<MonthlyPublication> {
  await assertEditor();
  const publication: MonthlyPublication = {
    ...pdfs,
    publishedAt: new Date().toISOString(),
  };
  await setMonthlyPublication(name, publication);
  // The public /monatsblatt page reads the issue through the same cache tag.
  revalidateTag("monthly", "hours");
  return publication;
}

/** Publication of an issue, for the editor's "zuletzt veröffentlicht" hint. */
export async function fetchMonthlyPublication(
  name: string,
): Promise<MonthlyPublication | undefined> {
  await assertEditor();
  const record = await repoFetchByName(name);
  if (!record) return undefined;
  return {
    flyerPdfUrl: record.flyerPdfUrl ?? "",
    posterPdfUrl: record.posterPdfUrl ?? "",
    insertPdfUrl: record.insertPdfUrl ?? "",
    publishedAt: record.publishedAt ?? "",
  };
}

export async function fetchMonthlyDataByName(
  name: string,
): Promise<unknown | undefined> {
  await assertEditor();
  return (await repoFetchByName(name))?.data;
}

/**
 * Upload an image for an IMAGE tile into the `monthly_images` collection.
 * Returns the public file URL (PB serves files publicly; the print route
 * loads them straight from there). Records are create-only — replacing a
 * tile's image simply creates a new record; orphans are negligible in size.
 */
export async function uploadMonthlyImage(form: FormData): Promise<string> {
  await assertEditor();
  const file = form.get("image");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    throw new Error("Keine gültige Bilddatei");
  }
  const client = await pb();
  const record = await client.collection("monthly_images").create(form);
  return pbFileUrl("monthly_images", record.id, record.image as string);
}

/**
 * AI rewrite of an article body. Uses the same OpenAI setup as
 * app/(shared)/ChatGpt.ts but deliberately WITHOUT the prompt cache:
 * rewrites are creative — asking again should give a new take, and
 * article bodies can exceed the cache table's text limits.
 */
export async function rewriteArticleBody(
  instruction: string,
  title: string,
  html: string,
): Promise<string> {
  await assertEditor();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Newest stable mini-tier model (checked July 2026); plenty for
      // short German rewrites at a fraction of full-model cost.
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content:
            "Du überarbeitest Ankündigungstexte für das gedruckte Monatsblatt " +
            "der katholischen Pfarre Emmaus am Wienerberg. Antworte NUR mit dem " +
            "neuen Text als HTML-Body: erlaubt sind ausschließlich <p>-, " +
            "<strong>- und <em>-Tags, keine Überschriften, keine Listen, kein " +
            "Markdown, keine Anführungszeichen um die Antwort. Schreibe in " +
            "vollständigen Sätzen (kein Stichwort- oder Telegrammstil). Der " +
            "Titel steht bereits über der Kachel — wiederhole ihn nicht als " +
            "Überschrift oder ersten Satz im Text. Lass den katholischen " +
            "Glauben natürlich mitklingen (etwa Dankbarkeit, Gebet, " +
            "Gemeinschaft im Glauben), ohne aufgesetzt fromm zu wirken. Halte " +
            "den Text kompakt (Platz auf dem Flyer ist knapp) und behält alle " +
            "Fakten (Daten, Uhrzeiten, Orte, Kontakte) exakt bei, sofern die " +
            "Anweisung nichts anderes verlangt.",
        },
        {
          role: "user",
          content:
            `Anweisung: ${instruction}\n\n` +
            `Titel der Ankündigung: ${title}\n\n` +
            `Bisheriger Text (HTML):\n${html || "(noch leer)"}`,
        },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`OpenAI request failed: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

const LetterCheckOutput = z.object({ html: z.string().min(1) });

/**
 * Spelling, paragraph and typography check of the "Wort des Pfarrers": the
 * model corrects errors, splits paragraphs and bolds key facts without
 * rewording; typography
 * rules it applies unreliably are enforced afterwards in code. The editor
 * reviews the result as a diff. No prompt cache, like rewriteArticleBody.
 */
export async function checkLetterText(html: string): Promise<string> {
  await assertEditor();
  if (!html.trim()) throw new Error("Kein Text vorhanden");
  if (html.length > 30_000) throw new Error("Der Text ist zu lang");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du prüfst das „Wort des Pfarrers“ für das gedruckte Monatsblatt " +
            "der katholischen Pfarre Emmaus am Wienerberg (Wien). Korrigiere " +
            "nur Rechtschreibung, Grammatik, Zeichensetzung und Tippfehler nach " +
            "österreichischem Deutsch (z. B. „Jänner“). Behalte Wortwahl, Stil, " +
            "Anrede, Gendern und alle Fakten (Namen, Daten, Uhrzeiten, Beträge) " +
            "exakt bei, auch deren Schreibweise (Datum „03.10.“ bleibt ohne " +
            "Leerzeichen); formuliere nichts um und kürze nichts. Formatierung: " +
            "Anrede und Grußformel als eigene Absätze; teile lange Textblöcke " +
            "an jedem inhaltlichen Übergang in Absätze (ein Thema je Absatz, " +
            "meist drei bis sechs Sätze). Erlaubt sind ausschließlich " +
            "<p>, <br>, <strong> und <em>; bestehende Hervorhebungen bleiben. " +
            "Hebe wie in einem Pfarrblatt die Schlüsselinformationen mit " +
            "<strong> hervor, damit man den Text überfliegen kann: Ereignisse " +
            "und Veranstaltungen (z. B. „Taufe von Lorenz Rian“, „hl. Messe um " +
            "17 Uhr“), Namen von Projekten und Aktionen sowie gesammelte " +
            "Beträge. Sparsam: kurze Wortgruppen, nie ganze Sätze, höchstens " +
            "eine Hervorhebung pro Satz. Die Grußformel am Ende in <em>. " +
            "Keine leeren Absätze. Typografie: deutsche Anführungszeichen " +
            "„…“, Auslassungszeichen … statt ..., Abkürzungen mit Leerzeichen " +
            "(z. B., u. a., d. h.), Gedankenstrich – mit Leerzeichen statt " +
            "Bindestrich zwischen Satzteilen, keine doppelten Leerzeichen. " +
            'Antworte nur mit JSON: {"html": "<p>…</p>"}. Gibt es nichts zu ' +
            "ändern, liefere den Text unverändert.",
        },
        { role: "user", content: html },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`OpenAI request failed: ${response.status}`);
  const data = await response.json();
  let parsed: z.infer<typeof LetterCheckOutput>;
  try {
    parsed = LetterCheckOutput.parse(
      JSON.parse(data.choices[0].message.content),
    );
  } catch {
    throw new Error("Die KI-Antwort konnte nicht gelesen werden");
  }
  return normalizeTypography(sanitizeLetterHtml(parsed.html));
}

const CrosswordGenerationInput = z.object({
  announcements: z
    .array(
      z.object({
        title: z.string().max(200),
        html: z.string().max(10_000),
      }),
    )
    .min(1)
    .max(30),
});

const CrosswordGenerationOutput = z.object({
  candidates: z
    .array(
      z.object({
        answer: z.string().min(3).max(20),
        clue: z.string().min(2).max(60),
      }),
    )
    .min(6)
    .max(12),
});

function announcementText(announcement: CrosswordAnnouncement): string {
  const htmlWithWordBoundaries = announcement.html.replace(/<[^>]+>/g, " ");
  return sanitize(`${announcement.title}\n${htmlWithWordBoundaries}`, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateCrosswordWords(
  input: unknown,
): Promise<CrosswordEntry[]> {
  await assertEditor();
  const { announcements } = CrosswordGenerationInput.parse(input);
  const sources = announcements.map(announcementText).filter(Boolean);
  if (!sources.length) throw new Error("Keine Ankündigungstexte vorhanden");
  if (sources.reduce((sum, source) => sum + source.length, 0) > 30_000) {
    throw new Error("Die Ankündigungstexte sind für eine Anfrage zu lang");
  }
  let parsed: z.infer<typeof CrosswordGenerationOutput>;
  try {
    const response = await getCrosswordCandidates(sources);
    const json = response
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    parsed = CrosswordGenerationOutput.parse(JSON.parse(json));
  } catch {
    throw new Error("Die KI-Antwort konnte nicht gelesen werden");
  }

  return parsed.candidates.map((candidate) => ({
    answer: normalizeCrosswordAnswer(candidate.answer),
    clue: candidate.clue.trim(),
  }));
}

/**
 * Papal prayer intention for the issue month (from `papal_intentions`).
 * No editor guard: the text is public content (it gets printed), matching
 * the openness of the event/liturgy loads.
 */
export async function loadPapalIntention(
  month: string,
): Promise<PapalIntention | undefined> {
  return fetchPapalIntention(month);
}
