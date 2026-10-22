"use client";

import { apiUrl, FileInfo } from "@/app/(shared)/ResourceAPI";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface LightboxProps {
  files: FileInfo[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ files, index, onClose, onNavigate }: LightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const hasMultiple = files.length > 1;

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + files.length) % files.length);
  }, [index, files.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % files.length);
  }, [index, files.length, onNavigate]);

  useEffect(() => {
    setLoaded(false);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, goPrev, goNext]);

  const file = files[index];
  if (!file) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50 && hasMultiple) {
      if (delta > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute top-0 right-0 left-0 flex items-center justify-between p-4">
        <span className="text-sm text-white/70">
          {index + 1} / {files.length}
        </span>
        <div className="flex items-center gap-1">
          <a
            href={`${apiUrl}/${file.fullUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Original öffnen"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:left-6"
          aria-label="Vorheriges Foto"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      <img
        key={file.filename}
        src={`${apiUrl}/${file.fullUrl}`}
        alt={file.filename}
        onLoad={() => setLoaded(true)}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[88vh] max-w-[92vw] object-contain transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:right-6"
          aria-label="Nächstes Foto"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
    </div>
  );
}
