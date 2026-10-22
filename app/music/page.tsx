import Site from "@/components/Site";
import type { Metadata } from "next";
import { MusicWorkbench } from "./MusicWorkbench";

export const metadata: Metadata = {
  title: "Musik | Pfarre Emmaus am Wienerberg",
  description:
    "Einfache Uebungsseite fuer Chorstimmen mit Notenvorschau und Wiedergabe.",
};

export default function MusicPage() {
  return (
    <Site title="Musik" showTitle>
      <MusicWorkbench />
    </Site>
  );
}
