"use client";

import Link from "next/link";
import Site from "../components/Site";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Site title="Seite nicht gefunden" footer={false} responsive={false}>
      <div className="flex h-full grow items-center justify-center py-12">
        <div className="flex items-center gap-6">
          <Image
            src="/icon_not_found.svg"
            alt="Trauriges Smiley"
            width={100}
            height={100}
          />
          <div className="flex flex-col">
            <div className="text-lg font-semibold">Seite nicht gefunden</div>
            <Link
              href="/"
              className="-mx-4 -my-2 underline opacity-60 hover:no-underline"
            >
              <Button variant="ghost">Zurück zur Startseite</Button>
            </Link>
          </div>
        </div>
      </div>
    </Site>
  );
}
