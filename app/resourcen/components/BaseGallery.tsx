"use client";

import { apiUrl, FileInfo, Folder } from "@/app/(shared)/ResourceAPI";
import { Check } from "lucide-react";
import { useState } from "react";
import { Lightbox } from "./Lightbox";
import { useJustifiedLayout } from "./useJustifiedLayout";

export interface GallerySelection {
  enabled: boolean;
  selected: Set<string>;
  onToggle: (filename: string) => void;
}

export function BaseGallery(props: {
  folder: Folder;
  files: FileInfo[];
  selection?: GallerySelection;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const items = props.files.map((file) => ({
    ...file,
    aspectRatio:
      file.width && file.height && file.height > 0
        ? file.width / file.height
        : 1,
  }));

  const { containerRef, rows, gap } = useJustifiedLayout(items, {
    gap: 8,
    targetRowHeight: 220,
  });

  const selectionEnabled = props.selection?.enabled ?? false;

  return (
    <>
      <div
        ref={containerRef}
        className="flex flex-col"
        style={{ gap, minHeight: 220 }}
      >
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex" style={{ gap }}>
            {row.map(({ item: file, index, width, height }) => {
              const isSelected = props.selection?.selected.has(file.filename);

              return (
                <div
                  key={file.filename}
                  className="relative shrink-0"
                  style={{ width, height }}
                >
                  <button
                    onClick={() =>
                      selectionEnabled
                        ? props.selection?.onToggle(file.filename)
                        : setLightboxIndex(index)
                    }
                    className={`group block h-full w-full overflow-hidden rounded-md border transition-all ${
                      isSelected
                        ? "border-2 border-blue-500 ring-2 ring-blue-200"
                        : "border-black/10 hover:border-black/20"
                    }`}
                    aria-label={
                      selectionEnabled
                        ? `Foto ${index + 1} auswählen`
                        : `Foto ${index + 1} öffnen`
                    }
                    aria-pressed={selectionEnabled ? isSelected : undefined}
                  >
                    <img
                      src={`${apiUrl}/${file.thumbUrl}`}
                      alt={file.filename}
                      loading="lazy"
                      className={`h-full w-full object-cover ${
                        selectionEnabled
                          ? ""
                          : "transition-transform duration-200 group-hover:scale-[1.03]"
                      }`}
                    />
                  </button>

                  {selectionEnabled && isSelected && (
                    <div className="pointer-events-none absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          files={props.files}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
