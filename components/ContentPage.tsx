import { ReactNode } from "react";

/** Photo hero for static content pages, sized like the homepage cover. */
export function ContentHero({
  image,
  imagePosition = "center",
  title,
  subtitle,
  overlap = false,
  children,
}: {
  image: string;
  imagePosition?: string;
  title: string;
  subtitle: string;
  /** Leaves room at the bottom for a card pulled up over the hero. */
  overlap?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 lg:mt-16">
      <div className="h-3xl relative overflow-hidden rounded-xl shadow-xl">
        <div
          className="animate-hero-zoom absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url(${image})`,
            backgroundPosition: imagePosition,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />
        <div
          className={`absolute inset-x-0 bottom-0 flex flex-col items-start gap-5 p-6 lg:p-12 ${overlap ? "pb-24 lg:pb-32" : ""}`}
        >
          <h1 className="text-5xl font-bold tracking-tight text-white italic drop-shadow-md lg:text-8xl">
            {title}
          </h1>
          <p className="max-w-xl text-lg font-semibold text-white/90 drop-shadow lg:text-2xl">
            {subtitle}
          </p>
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export function SectionIntro({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-bold text-balance">{title}</h2>
      {children && (
        <p className="mt-5 text-lg leading-relaxed text-pretty text-neutral-700 lg:text-xl">
          {children}
        </p>
      )}
    </div>
  );
}

/** Vertical timeline; `date` is a year (or short date) shown beside the text. */
export function Timeline({
  events,
}: {
  events: { date: string; text: string }[];
}) {
  return (
    <ol className="relative mt-12 flex flex-col gap-10">
      <span
        aria-hidden
        className="bg-emmaus/25 absolute top-3 bottom-3 left-[4px] w-0.5"
      />
      {events.map((event) => (
        <li
          key={event.date}
          className="relative grid gap-1 pl-8 md:grid-cols-[5rem_1fr] md:gap-8"
        >
          <span className="bg-emmaus absolute top-2 left-0 size-2.5 rounded-full" />
          <div className="text-emmaus font-semibold">{event.date}</div>
          <p className="max-w-2xl text-lg leading-relaxed text-neutral-700">
            {event.text}
          </p>
        </li>
      ))}
    </ol>
  );
}
