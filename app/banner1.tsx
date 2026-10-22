"use client";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const DEFAULT_IMAGE =
  "https://api.emmaus.wien/files/folder_6a21c02de166f1.87502911/full/img_6a21c05317c401.09575838.jpg";

export function Banner1({
  text = "Und sie erkannten ihn beim Brechen des Brotes.",
  image = DEFAULT_IMAGE,
}: {
  text?: string;
  image?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  const words = text.split(" ");

  return (
    <div className="mx-auto mt-12 w-full max-w-5xl px-4">
      <div className="relative h-[500px] overflow-hidden rounded-xl shadow-xl lg:h-[600px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        ></div>
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/40"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center font-black text-white italic">
          <motion.div
            ref={ref}
            {...({
              className:
                "flex flex-wrap justify-center gap-x-3 text-4xl font-semibold drop-shadow-lg lg:gap-x-4 lg:text-6xl",
            } as any)}
          >
            {words.map((word, index) => {
              const centerProgress = useTransform(
                scrollYProgress,
                [0, 0.5, 1],
                [0, 1, 1],
              );

              const wordProgress = useTransform(centerProgress, [0, 1], [0, 1]);

              const opacity = useTransform(
                wordProgress,
                [index / words.length, (index + 1) / words.length],
                [0, 1],
              );

              return (
                <motion.span key={index} style={{ opacity }}>
                  {word}
                </motion.span>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
