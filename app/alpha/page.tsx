import AlphaRegistrationSection from "@/app/alpha/AlphaRegistrationSection";
import Site from "@/components/Site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";
import Image from "next/image";
import {
  PiCalendarCheckBold,
  PiMapPinAreaBold,
  PiPhoneCallBold,
} from "react-icons/pi";

const alphaSeoDescription =
  "Alpha-Kurs in der Pfarre Emmaus am Wienerberg: Neue Leute kennenlernen, Glaubensfragen stellen und Gemeinschaft erleben. Jetzt online anmelden.";
const alphaPageUrl = "https://emmaus.wien/alpha";

export const metadata: Metadata = {
  title: "Alpha-Kurs | Pfarre Emmaus am Wienerberg",
  description: alphaSeoDescription,
  keywords: [
    "Alpha Kurs Wien",
    "Alpha-Kurs",
    "Pfarre Emmaus",
    "Glaubenskurs Wien",
    "christlicher Kurs Wien",
    "Alpha Anmeldung",
  ],
  alternates: {
    canonical: alphaPageUrl,
  },
  openGraph: {
    title: "Alpha-Kurs in Emmaus",
    description: alphaSeoDescription,
    url: alphaPageUrl,
    type: "website",
    locale: "de_AT",
    siteName: "Pfarre Emmaus am Wienerberg",
    images: [
      {
        url: "/hero/alpha-marketing-1024.jpg",
        width: 1024,
        height: 683,
        alt: "Alpha-Kurs in Emmaus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpha-Kurs in Emmaus",
    description: alphaSeoDescription,
    images: ["/hero/alpha-marketing-1024.jpg"],
  },
};

export default function AlphaRegistrationPage() {
  const alphaJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: "Alpha-Kurs in Emmaus",
        description: alphaSeoDescription,
        provider: {
          "@type": "Church",
          name: "Pfarre Emmaus am Wienerberg",
          url: "https://emmaus.wien",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "in person",
          location: {
            "@type": "Place",
            name: "Pfarre Emmaus am Wienerberg",
            address: {
              "@type": "PostalAddress",
              streetAddress: "August-Sigl-Straße 3",
              postalCode: "1100",
              addressLocality: "Wien",
              addressCountry: "AT",
            },
          },
          startDate: "2026-04-17T18:30:00+02:00",
          endDate: "2026-06-26T21:00:00+02:00",
        },
      },
      {
        "@type": "Event",
        name: "Alpha-Tag",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        startDate: "2026-05-29T09:30:00+02:00",
        endDate: "2026-05-29T17:00:00+02:00",
        location: {
          "@type": "Place",
          name: "Pfarre Emmaus am Wienerberg",
          address: {
            "@type": "PostalAddress",
            streetAddress: "August-Sigl-Straße 3",
            postalCode: "1100",
            addressLocality: "Wien",
            addressCountry: "AT",
          },
        },
        organizer: {
          "@type": "Church",
          name: "Pfarre Emmaus am Wienerberg",
          email: "alpha@emmaus.wien",
          url: alphaPageUrl,
        },
      },
    ],
  };

  return (
    <Site>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(alphaJsonLd) }}
      />
      <div className="relative mb-6 h-72 w-full overflow-hidden rounded-lg shadow-lg md:h-[28rem]">
        <Image
          src="/hero/alpha-marketing-1024.jpg"
          alt="Alpha Kurs - Gespräch in Kleingruppen"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/15" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-2xl px-6 text-center text-white">
            <h1 className="alpha-hero-title text-3xl font-bold drop-shadow-md md:text-5xl">
              Neue Leute kennenlernen und gemeinsam den Glauben entdecken.
            </h1>
            <p className="alpha-hero-subtitle mt-3 text-base font-medium md:text-xl">
              Der erste Alpha-Kurs in Emmaus
            </p>
          </div>
        </div>
      </div>
      <div className="pb-12">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 from-primary/5 bg-gradient-to-b to-transparent text-base">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary flex items-center gap-2 text-xl font-black">
                <PiCalendarCheckBold className="text-2xl" />
                Wann?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">
                10 Freitagabende von 18:30-21:00 Uhr
              </p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                <p>Fr, 17.04</p>
                <p>Fr, 24.04.</p>
                <p>Fr, 01.05.</p>
                <p>Fr, 08.05.</p>
                <p>Fr, 15.05.</p>
                <p>Fr, 22.05.</p>
                <p>Fr, 05.06.</p>
                <p>Fr, 12.06.</p>
                <p>Fr, 19.06.</p>
                <p>Fr, 26.06.</p>
              </div>
              <p className="pt-2">
                Am Samstag, 30.05.2026, findet ein gemeinsamer{" "}
                <strong className="font-semibold">Alpha-Tag</strong> statt
                (9:30-17:00 Uhr).
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 from-primary/5 bg-gradient-to-b to-transparent text-base">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary flex items-center gap-2 text-xl font-black">
                <PiMapPinAreaBold className="text-2xl" />
                Wo?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">Pfarre Emmaus am Wienerberg</p>
              <p>Eingang: August-Sigl-Straße 3,</p>
              <p>1100 Wien</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 from-primary/5 bg-gradient-to-b to-transparent text-base">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary flex items-center gap-2 text-xl font-black">
                <PiPhoneCallBold className="text-2xl" />
                Kontakt & Anmeldung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="mailto:alpha@emmaus.wien"
                className="font-semibold underline"
              >
                alpha@emmaus.wien
              </a>
              <p>
                Anmeldung hier auf der Website oder nach Sonntagsmesse in der
                Pfarre Emmaus am Wienerberg
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="my-12 space-y-4 md:columns-2">
          <p>
            Der Alpha-Kurs bietet die Gelegenheit, den tiefen Fragen des
            Glaubens und des Lebens nachzugehen. Dieser Kurs richtet sich
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              an Menschen, die dem christlichen Glauben offen gegenüberstehen
              und sich vorstellen können, ihm eine Chance zu geben,
            </li>
            <li>
              sowie an Menschen, die den christlichen Glauben bereits kennen,
              diesen aber weiter vertiefen möchten.
            </li>
          </ul>
          <p>
            Der Alpha-Kurs ist somit einerseits ein echter Einsteigerkurs: Man
            kann ohne jegliche Voraussetzung an diesem teilnehmen. Andererseits
            eignet er sich ebenso für Menschen, die meinen, die wesentlichen
            Fragen ihres Glaubens und Lebens bereits geklärt zu haben.
          </p>
          <p>
            Auch langjährige Kirchgänger erleben Alpha immer wieder als eine
            wunderbare Bereicherung.
          </p>

          <p>
            Die Teilnehmerinnen und Teilnehmer werden während des Kurses eine
            herzliche Gastfreundschaft, inspirierende Impulse und bereichernde
            Gespräche erfahren.
          </p>
          <p>
            Jeder Abend beginnt mit einem{" "}
            <em className="font-bold italic">warmen Abendessen</em>.
            Anschließend folgt ein inhaltlicher Impuls, danach ist Zeit für den
            Austausch in kleinen Gesprächsgruppen.
          </p>
        </div>

        <AlphaRegistrationSection />
      </div>
    </Site>
  );
}
