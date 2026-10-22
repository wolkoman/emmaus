import { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import { ReactNode } from "react";
import "../styles/globals.css";

const sourceSans3 = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-source-sans-3",
});

export const metadata: Metadata = {
  title: "Pfarre Emmaus am Wienerberg",
  description: "Katholische Pfarre im zehnten Wiener Gemeindebezirk",
  icons: "/logo.png",
  metadataBase: new URL("https://www.emmaus.wien"),
  // The default share image (opengraph-image.tsx) is dropped by pages that set their own `openGraph`, so they must set `images`.
};
export const viewport: Viewport = {
  themeColor: "#3A7276",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={sourceSans3.variable}>
      <body className={"bg-white"}>{children}</body>
    </html>
  );
}
