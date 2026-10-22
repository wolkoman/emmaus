"use client";

import { useMemo, useState } from "react";
import { MusicInput } from "./MusicInput";
import { MusicPlayer } from "./MusicPlayer";
import { MusicPreview } from "./MusicPreview";
import { DEFAULT_SOURCE, parseMusic } from "./music-format";

export function MusicWorkbench() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);

  const parsed = useMemo(() => parseMusic(source), [source]);

  return (
    <div className="mb-16 flex flex-col gap-6">
      <div className="from-emmaus/8 to-emmaus/4 ring-emmaus/10 rounded-3xl bg-gradient-to-br via-white p-6 shadow-sm ring-1">
        <h2 className="text-2xl font-semibold text-gray-950">
          Melodie eingeben, ansehen und anhoeren
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
          This MVP uses a tiny text format so choir members can type notes by
          hand, check them on a staff, and play them back for practice.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <MusicInput
            source={source}
            onSourceChange={setSource}
            errors={parsed.errors}
          />
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <MusicPlayer
              parsed={parsed}
              onActiveNoteIdsChange={setActiveNoteIds}
            />
          </div>
        </div>
      </div>

      <MusicPreview staves={parsed.staves} activeNoteIds={activeNoteIds} />
    </div>
  );
}
