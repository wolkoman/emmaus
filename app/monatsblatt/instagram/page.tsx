import { formatDate } from "@/app/(shared)/Localization";
import { tilesInReadingOrder } from "@/app/monatsblatt/content";
import { LETTER_TITLE, letterSlotIds } from "@/app/monatsblatt/letter";
import { MonthlyData } from "@/app/monatsblatt/editor/store";
import { fetchPublishedMonthly } from "@/app/monatsblatt/fetchMonthly.server";
import { evangelienDays } from "@/app/monatsblatt/FlyerTiles";
import { liturgyDayName } from "@/domain/liturgy/liturgy-order";
import { loadCachedLiturgyData } from "@/domain/liturgy/liturgy-loading";
import Site from "@/components/Site";
import InstagramPagesWrapper from "./InstagramPagesWrapper";
import type { InstagramContentSection } from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default async function Page() {
  const [issue, liturgies] = await Promise.all([
    fetchPublishedMonthly(),
    loadCachedLiturgyData(),
  ]);

  if (!issue) {
    return (
      <Site title="Monatsblatt Instagram">
        <div className="my-12">Kein veröffentlichtes Monatsblatt gefunden.</div>
      </Site>
    );
  }

  const data = issue.data as MonthlyData;
  const sections: InstagramContentSection[] = [
    ...tilesInReadingOrder(data.tiles).flatMap(
      (tile): InstagramContentSection[] => {
        if (tile.type === "ARTICLE") {
          return [
            {
              id: tile.id,
              title: tile.title,
              text: tile.text,
              icon: { kind: "article", name: tile.icon },
            },
          ];
        }

        if (tile.type === "LETTER" && data.letter?.text) {
          // The letter is one text; its continuation frames add nothing.
          if (tile.id !== letterSlotIds(data.tiles)[0]) return [];
          return [
            {
              id: tile.id,
              title: LETTER_TITLE,
              text: data.letter.text,
              icon: { kind: "article", name: "Church" },
            },
          ];
        }

        if (tile.type === "IMAGE" && tile.url) {
          return [
            {
              id: tile.id,
              title: "",
              text: `<img src="${escapeHtml(tile.url)}" alt="" />`,
              variant: "image",
            },
          ];
        }

        if (tile.type === "EVANGELIEN") {
          const lines = evangelienDays(data.events, liturgies).map(
            ({ date, liturgy }) =>
              `${formatDate(date, {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              })} · ${liturgy.evangelium} · ${liturgyDayName(liturgy)}`,
          );
          return [
            {
              id: tile.id,
              title: "Evangelien des Monats",
              text: [
                "Vorher gelesen, wird das Wort im Gottesdienst vertrauter. Nachher gelesen, begleitet es durch die Woche.",
                lines.map(escapeHtml).join("<br/>"),
              ]
                .filter(Boolean)
                .join("<br/><br/>"),
              icon: { kind: "tile", name: "EVANGELIEN" },
            },
          ];
        }

        if (tile.type === "GEBETSANLIEGEN") {
          return [
            {
              id: tile.id,
              title: "Gebetsanliegen des Papstes",
              text: data.papalIntention
                ? `${escapeHtml(data.papalIntention.title)}<br/><br/>${escapeHtml(data.papalIntention.text)}`
                : "Für diesen Monat ist kein Gebetsanliegen hinterlegt.",
              icon: { kind: "tile", name: "GEBETSANLIEGEN" },
            },
          ];
        }

        return [];
      },
    ),
    {
      id: "events-online",
      title: "",
      text: "Die aktuelle Terminübersicht finden Sie jederzeit auf unserer Website: <strong>emmaus.wien/termine</strong>",
      icon: { kind: "tile", name: "EVENTS" },
      variant: "notice",
    },
  ];

  return (
    <Site title="Monatsblatt Instagram">
      <style>
        {
          "@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap');"
        }
      </style>

      <InstagramPagesWrapper
        coverText={data.coverText || issue.name}
        issueName={data.name || issue.name}
        filenamePrefix={`monatsblatt-${issue.month}`}
        sections={sections}
      />
    </Site>
  );
}
