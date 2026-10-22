import { LiturgyData } from "@/domain/liturgy/liturgy-data";
import { XMLParser } from "fast-xml-parser";
import { liturgyRepo } from "@/domain/liturgy/liturgy-repo";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { cache } from "react";

async function fetchLiturgyData(year: number): Promise<LiturgyData> {
  const xml = await fetch(
    `https://www.eucharistiefeier.de/lk/api.php?jahr=${year}`,
  )
    .then((response) => response.text())
    .then((response) => response.replace(/<br>/g, ""))
    .then(
      (response) =>
        new XMLParser({ alwaysCreateTextNode: true }).parse(response).html.head
          .body.table.tbody.tr,
    );

  return Object.fromEntries(
    xml
      .reduce(
        (data: any, { td }: { td: Cell }) =>
          isNewDate(td)
            ? [
                ...data,
                {
                  date: transformDate(td[0] as TextNode),
                  liturgies: transformLiturgy(td.slice(1)),
                },
              ]
            : [
                ...data.slice(0, -1),
                {
                  ...data.at(-1),
                  liturgies: [
                    ...data.at(-1)!.liturgies,
                    ...transformLiturgy(td),
                  ],
                },
              ],
        [],
      )
      .map(({ date, liturgies }: any) => [date, liturgies]),
  );
}

/**
 * Import the liturgical calendar (readings, colors, ranks) from
 * eucharistiefeier.de for the current and next year, and upsert it into the
 * `liturgies` collection in Pocketbase. Replaces the old `saveToCockpit()`.
 *
 * Merge semantics: existing dates outside the imported years are kept.
 */
export async function importLiturgicalCalendar() {
  const year = new Date().getFullYear();
  const [data, data2] = await Promise.all([
    fetchLiturgyData(year),
    fetchLiturgyData(year + 1),
  ]);
  await liturgyRepo().saveLiturgy({ ...data, ...data2 });
}

export async function loadLiturgyData() {
  "use cache";
  cacheLife("days");
  const until = new Date(Date.now() + 1000 * 3600 * 24 * 120);
  const today = new Date(Date.now() - 1000 * 3600 * 24 * 7);
  const data = await liturgyRepo().fetchLiturgy();
  return Object.entries(data)
    .filter(([date]) => today <= new Date(date) && new Date(date) <= until)
    .flatMap(([date, liturgies]) =>
      liturgies.map((liturgy) => ({ date, ...liturgy })),
    );
}

export const loadCachedLiturgyData = cache(async () => {
  return await loadLiturgyData();
});

interface TextNode {
  "#text": string;
}

type SpanNode = { span: TextNode | TextNode[] };
type Cell = (SpanNode | TextNode)[];

function isNewDate(td: any) {
  return !td[0]?.span;
}

function transformDate(date: TextNode) {
  return date["#text"].split(".").reverse().join("-");
}

function transformLiturgy(td: Cell) {
  return [
    td.map((cell) =>
      "span" in cell
        ? Array.isArray(cell.span)
          ? cell.span.map((text) => text["#text"]).join(", ")
          : cell.span["#text"]
        : cell["#text"],
    ),
  ].map((texts) => ({
    name: texts[0],
    rank: texts[1],
    color: texts[2],
    reading1: texts[3],
    reading2: texts[5],
    psalm: texts[4],
    evangelium: texts[6],
  }));
}
