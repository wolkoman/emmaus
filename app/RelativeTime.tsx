"use client";

import { useState, useEffect } from "react";

export default function RelativeTime(props: { date: Date }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const diff = new Date().getTime() - props.date.getTime();
  const hours = Math.round(diff / (60 * 60 * 1000));
  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  const weeks = Math.round(diff / (7 * 24 * 60 * 60 * 1000));

  return (
    <>
      {hours < 24
        ? `vor ${hours} ${hours === 1 ? "Stunde" : "Stunden"}`
        : days < 7
          ? `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`
          : `vor ${weeks} ${weeks === 1 ? "Woche" : "Wochen"}`}
    </>
  );
}
