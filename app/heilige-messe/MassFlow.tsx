"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState } from "react";
import type { MassPart } from "./content";

export function MassFlow({ parts }: { parts: MassPart[] }) {
  const [active, setActive] = useState(0);
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Derived from positions rather than IntersectionObserver so anchor jumps land on the right part.
  useMotionValueEvent(scrollY, "change", () => {
    const steps = stepsRef.current?.children;
    if (!steps) return;
    const center = window.innerHeight / 2;
    let index = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].getBoundingClientRect().top <= center) index = i;
    }
    setActive(index);
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="hidden lg:block">
        <div className="sticky top-8 h-[calc(100vh-4rem)] max-h-[760px] overflow-hidden rounded-xl shadow-xl">
          {parts.map((part, i) => (
            <div
              key={part.id}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out ${
                i === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
              }`}
              style={{ backgroundImage: `url(${part.image})` }}
            />
          ))}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white">
            <div className="flex gap-2">
              {parts.map((part, i) => (
                <a
                  key={part.id}
                  href={`#${part.id}`}
                  aria-label={part.title}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                    i <= active ? "bg-white" : "bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div ref={stepsRef} className="flex flex-col gap-16 lg:gap-0">
        {parts.map((part) => (
          <PartStep key={part.id} part={part} />
        ))}
      </div>
    </div>
  );
}

function PartStep({ part }: { part: MassPart }) {
  return (
    <section
      id={part.id}
      className="flex scroll-mt-8 flex-col justify-center lg:min-h-[85vh]"
    >
      <div
        className="mb-6 aspect-[4/3] rounded-xl bg-cover bg-center shadow-xl lg:hidden"
        style={{ backgroundImage: `url(${part.image})` }}
      />
      <h3 className="text-2xl font-bold italic">{part.title}</h3>
      <p className="mt-5 text-lg leading-relaxed text-pretty text-neutral-700">
        {part.text}
      </p>

      <ol className="relative mt-6 flex flex-col gap-2 leading-6">
        <span
          aria-hidden
          className="bg-emmaus/25 absolute top-3 bottom-3 left-[4px] w-0.5"
        />
        {part.moments.map((moment) => (
          <li key={moment} className="relative flex items-center gap-4">
            <span className="bg-emmaus size-2.5 shrink-0 rounded-full" />
            {moment}
          </li>
        ))}
      </ol>
    </section>
  );
}
