import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatDay, LIVE_TEXT } from "./i18n";
import { LIVESTREAM } from "./livestream";

export const alt = "Hl. Carlo Acutis in der Pfarre Emmaus am Wienerberg";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (weight: number) =>
  readFile(
    join(
      process.cwd(),
      `node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-${weight}-normal.woff`,
    ),
  );

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#3a7276",
          color: "white",
          fontFamily: "Source Sans 3",
        }}
      >
        <div style={{ fontSize: 110, fontWeight: 700 }}>
          {LIVE_TEXT.de.heading}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 44, lineHeight: 1.2 }}>
            {LIVE_TEXT.de.lead}
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>
            {formatDay(LIVESTREAM.start, "de")}
          </div>
          <div style={{ fontSize: 32, opacity: 0.8, marginTop: 24 }}>
            Pfarre Emmaus am Wienerberg · emmaus.wien/carlo
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Source Sans 3", data: await font(400), weight: 400 },
        { name: "Source Sans 3", data: await font(700), weight: 700 },
      ],
    },
  );
}
