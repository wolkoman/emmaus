import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Pfarre Emmaus am Wienerberg";
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
  const logo = await readFile(join(process.cwd(), "public/logo.png"));

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
          background: "white",
          color: "#1f2937",
          fontFamily: "Source Sans 3",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          width={160}
          height={160}
          alt=""
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#3a7276",
              lineHeight: 1.1,
            }}
          >
            Pfarre Emmaus am Wienerberg
          </div>
          <div style={{ fontSize: 40 }}>
            Katholische Pfarre im zehnten Wiener Gemeindebezirk
          </div>
          <div style={{ fontSize: 32, opacity: 0.7, marginTop: 24 }}>
            emmaus.wien
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
