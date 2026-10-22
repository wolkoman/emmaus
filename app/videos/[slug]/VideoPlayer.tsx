"use client";

import { useEffect, useRef, useState } from "react";
import { PiCheck, PiDownloadSimple, PiShareFat } from "react-icons/pi";
import { Button, buttonVariants } from "@/components/ui/button";

export function VideoPlayer(props: {
  poster?: string;
  /** Label → URL, highest quality first. */
  sources: Record<string, string>;
  download?: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const labels = Object.keys(props.sources);
  const [quality, setQuality] = useState(labels[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches && labels.length > 1)
      setQuality(labels[1]);
  }, []);

  const pending = useRef<{ time: number; playing: boolean } | null>(null);

  const switchQuality = (next: string) => {
    const video = videoRef.current;
    if (!video || next === quality) return;
    pending.current = { time: video.currentTime, playing: !video.paused };
    setQuality(next);
  };

  useEffect(() => {
    const video = videoRef.current;
    const resume = pending.current;
    if (!video || !resume) return;
    pending.current = null;
    video.addEventListener(
      "loadedmetadata",
      () => {
        video.currentTime = resume.time;
        if (resume.playing) void video.play();
      },
      { once: true },
    );
    // preload="none" would otherwise never fetch the new source's metadata.
    video.preload = "metadata";
    video.load();
  }, [quality]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: props.title, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <video
        ref={videoRef}
        src={props.sources[quality]}
        poster={props.poster}
        controls
        playsInline
        preload="none"
        className="aspect-video w-full rounded-xl bg-black"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold lg:text-3xl">{props.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {labels.length > 1 && (
            <div className="flex rounded-full bg-gray-200 p-1">
              {labels.map((q) => (
                <button
                  key={q}
                  onClick={() => switchQuality(q)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${q === quality ? "bg-emmaus text-white" : "hover:bg-black/5"}`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <Button variant="secondary" className="rounded-full" onClick={share}>
            {copied ? <PiCheck /> : <PiShareFat />}
            {copied ? "Link kopiert" : "Teilen"}
          </Button>
          {props.download && (
            <a
              href={props.download}
              download
              className={buttonVariants({
                variant: "secondary",
                className: "rounded-full",
              })}
            >
              <PiDownloadSimple />
              Herunterladen
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
