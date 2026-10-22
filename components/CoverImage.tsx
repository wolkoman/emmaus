"use client";

import { useEffect, useState } from "react";

const IMAGES = [
  "https://api.emmaus.wien/files/folder_6a21c02de166f1.87502911/full/img_6a21c0694ec445.40677666.jpg",
  "https://api.emmaus.wien/files/folder_6a21c02de166f1.87502911/full/img_6a21c05348a228.17612855.jpg",
  "https://api.emmaus.wien/files/folder_6a21c02de166f1.87502911/full/img_6a21c04e3b4834.11668565.jpg",
];

const SLIDE_INTERVAL = 6_000;

function HeroSlideshow({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl shadow-xl">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center ${
              index === currentIndex ? "animate-hero-zoom" : ""
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        </div>
      ))}

      {/* bottom fade for text legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

      {/* title + mass note */}
      <div className="absolute inset-x-0 bottom-0 p-6 lg:p-10">
        <h1 className="text-5xl font-bold tracking-tight text-white italic drop-shadow-md lg:text-7xl">
          <span className="block">Gemeinsam</span>
          <span className="block whitespace-nowrap">auf dem Weg</span>
        </h1>
        <p className="mt-3 pr-16 text-lg font-semibold text-white/90 drop-shadow lg:pr-0 lg:text-xl">
          Heilige Messe, sonntags 10:00 Uhr
        </p>
      </div>

      {/* indicator dots */}
      <div className="absolute right-6 bottom-6 flex gap-2 lg:right-10 lg:bottom-10">
        {images.map((_, index) => (
          <button
            key={index}
            aria-label={`Bild ${index + 1} anzeigen`}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-6 bg-white"
                : "w-2 bg-white/60 hover:bg-white/90"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function CoverImage() {
  return (
    <div className="relative lg:mb-16">
      <div className="h-3xl relative lg:my-16">
        <HeroSlideshow images={IMAGES} />
      </div>
    </div>
  );
}
