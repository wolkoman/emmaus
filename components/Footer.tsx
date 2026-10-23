"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import Responsive from "./Responsive";
import { Links } from "@/app/(shared)/Links";

export default function Footer({ dark }: { dark?: boolean }) {
  const link = dark
    ? "underline decoration-white/30 underline-offset-2 hover:text-[#aadcd8]"
    : "hover:text-emmaus underline decoration-black/20 underline-offset-2";
  return (
    <footer
      className={`print:hidden ${dark ? "bg-[#1f4a4d] text-white" : "mt-24 border-t border-black/5 bg-white/50 backdrop-blur-sm"}`}
    >
      <Responsive>
        <div className="grid gap-10 py-14 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-3">
            <Link
              href={Links.Hauptseite}
              className="flex items-center gap-3 hover:opacity-80"
            >
              <Image
                width={40}
                height={40}
                src="/logo.svg"
                alt="Logo der Pfarre Emmaus"
                className="rounded-full"
              />
              <span className="text-lg font-semibold">
                Pfarre Emmaus am Wienerberg
              </span>
            </Link>
            <div className="leading-relaxed">
              Röm.-kath. Pfarre Emmaus am Wienerberg
              <br />
              HerausgeberIn, Alleininhaber, Redaktion
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-semibold tracking-wide uppercase">Kontakt</div>
            <div className="leading-relaxed opacity-80">
              Tesarekplatz 2, 1100 Wien
              <br />
              Telefon:{" "}
              <Link
                href="tel:+4316163400"
                className={dark ? "hover:text-[#aadcd8]" : "hover:text-emmaus"}
              >
                +43 1 616 34 00
              </Link>
              <br />
              E-Mail:{" "}
              <Link href="mailto:kanzlei@emmaus.wien" className={link}>
                kanzlei@emmaus.wien
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="font-semibold tracking-wide uppercase">
              Unterstützung
            </div>
            <div className="leading-relaxed opacity-80">
              Wir bedanken uns sehr herzlich für Ihre finanzielle Unterstützung!
              <br />
              IBAN: AT97 1200 0503 2479 5601
              <br />
              BIC: BKAUATWW
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col items-start justify-between gap-2 border-t py-5 opacity-70 lg:flex-row lg:items-center ${dark ? "border-white/15" : "border-black/5"}`}
        >
          <div>© Röm.-kath. Pfarre Emmaus am Wienerberg</div>
          <Link href={Links.Impressum} className={link}>
            Impressum & Datenschutzerklärung
          </Link>
        </div>
      </Responsive>
    </footer>
  );
}
