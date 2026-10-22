"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Part, Sampler } from "tone";
import { getDurationInQuarters, type ParseResult, type ParsedNote, type ParsedStaff } from "./music-format";

type PlaybackEvent = {
  time: number;
  pitch: string | null;
  durationSeconds: number;
};

type ToneModule = typeof import("tone");

const DEFAULT_TEMPO = 72;
const PIANO_SAMPLE_BASE_URL = "https://tonejs.github.io/audio/salamander/";

export function MusicPlayer({
  parsed,
  onActiveNoteIdsChange,
}: {
  parsed: ParseResult;
  onActiveNoteIdsChange: (ids: string[]) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingInstrument, setIsLoadingInstrument] = useState(false);
  const [playbackTempo, setPlaybackTempo] = useState(String(DEFAULT_TEMPO));
  const [playbackTarget, setPlaybackTarget] = useState("all");
  const synthRef = useRef<Sampler | null>(null);
  const partRef = useRef<Part<PlaybackEvent> | null>(null);
  const toneRef = useRef<ToneModule | null>(null);
  const stopEventIdRef = useRef<number | null>(null);
  const visualEventIdsRef = useRef<number[]>([]);
  const activeNoteIdsRef = useRef<string[]>([]);

  const playbackStaves = useMemo(
    () =>
      playbackTarget === "all"
        ? parsed.staves
        : parsed.staves.filter((staff) => staff.id === playbackTarget),
    [parsed.staves, playbackTarget],
  );

  useEffect(() => {
    if (playbackTarget !== "all" && !parsed.staves.some((staff) => staff.id === playbackTarget)) {
      setPlaybackTarget("all");
    }
  }, [parsed.staves, playbackTarget]);

  useEffect(() => {
    return () => {
      const tone = toneRef.current;

      partRef.current?.dispose();
      synthRef.current?.dispose();

      if (tone && stopEventIdRef.current !== null) {
        tone.Transport.clear(stopEventIdRef.current);
      }

      visualEventIdsRef.current.forEach((eventId) => tone?.Transport.clear(eventId));
    };
  }, []);

  async function ensureTone() {
    if (toneRef.current) {
      return toneRef.current;
    }

    const tone = await import("tone");
    toneRef.current = tone;
    return tone;
  }

  async function stopPlayback() {
    const tone = await ensureTone();
    tone.Transport.stop();
    tone.Transport.cancel();
    partRef.current?.dispose();
    partRef.current = null;

    if (stopEventIdRef.current !== null) {
      tone.Transport.clear(stopEventIdRef.current);
      stopEventIdRef.current = null;
    }

    visualEventIdsRef.current.forEach((eventId) => tone.Transport.clear(eventId));
    visualEventIdsRef.current = [];
    activeNoteIdsRef.current = [];

    setIsPlaying(false);
    onActiveNoteIdsChange([]);
  }

  async function startPlayback() {
    if (parsed.errors.length) {
      return;
    }

    const numericTempo = Number(playbackTempo);
    if (!Number.isFinite(numericTempo) || numericTempo < 30 || numericTempo > 220) {
      return;
    }

    const tone = await ensureTone();
    await tone.start();
    await stopPlayback();

    if (!synthRef.current) {
      setIsLoadingInstrument(true);
      synthRef.current = new tone.Sampler({
        urls: {
          A1: "A1.mp3",
          A2: "A2.mp3",
          A3: "A3.mp3",
          A4: "A4.mp3",
          C2: "C2.mp3",
          C3: "C3.mp3",
          C4: "C4.mp3",
          C5: "C5.mp3",
          C6: "C6.mp3",
          "D#2": "Ds2.mp3",
          "D#3": "Ds3.mp3",
          "D#4": "Ds4.mp3",
          "D#5": "Ds5.mp3",
          "F#2": "Fs2.mp3",
          "F#3": "Fs3.mp3",
          "F#4": "Fs4.mp3",
          "F#5": "Fs5.mp3",
        },
        release: 1.2,
        baseUrl: PIANO_SAMPLE_BASE_URL,
      }).toDestination();
      await tone.loaded();
      setIsLoadingInstrument(false);
    }

    const synth = synthRef.current;
    if (!synth) {
      return;
    }

    synthRef.current = synth;
    activeNoteIdsRef.current = [];

    const quarterSeconds = 60 / numericTempo;
    let latestEndTime = 0;

    playbackStaves.forEach((staff) => {
      let currentTime = 0;

      staff.notes.forEach((note) => {
        const durationSeconds = getDurationInQuarters(note) * quarterSeconds;

        visualEventIdsRef.current.push(
          tone.Transport.scheduleOnce((time) => {
            tone.Draw.schedule(() => {
              if (!activeNoteIdsRef.current.includes(note.id)) {
                activeNoteIdsRef.current = [...activeNoteIdsRef.current, note.id];
                onActiveNoteIdsChange(activeNoteIdsRef.current);
              }
            }, time);
          }, currentTime),
        );

        visualEventIdsRef.current.push(
          tone.Transport.scheduleOnce((time) => {
            tone.Draw.schedule(() => {
              activeNoteIdsRef.current = activeNoteIdsRef.current.filter((id) => id !== note.id);
              onActiveNoteIdsChange(activeNoteIdsRef.current);
            }, time);
          }, currentTime + durationSeconds),
        );

        currentTime += durationSeconds;
      });

      latestEndTime = Math.max(latestEndTime, currentTime);
    });

    const mergedEvents = playbackStaves.flatMap((staff) => {
      let currentTime = 0;
      const merged: PlaybackEvent[] = [];

      staff.notes.forEach((note, index) => {
        const durationSeconds = getDurationInQuarters(note) * quarterSeconds;
        const previousNote = index > 0 ? staff.notes[index - 1] : null;
        const previousEvent = merged[merged.length - 1];
        const extendsPrevious =
          previousNote &&
          previousNote.type === "note" &&
          note.type === "note" &&
          previousNote.pitch === note.pitch &&
          previousNote.tieToNext &&
          previousEvent;

        if (extendsPrevious) {
          previousEvent.durationSeconds += durationSeconds;
        } else {
          merged.push({ time: currentTime, pitch: note.pitch, durationSeconds });
        }

        currentTime += durationSeconds;
      });

      latestEndTime = Math.max(latestEndTime, currentTime);
      return merged;
    });

    partRef.current = new tone.Part((time, event) => {
      if (event.pitch) {
        synth.triggerAttackRelease(event.pitch, event.durationSeconds, time);
      }
    }, mergedEvents).start(0);

    stopEventIdRef.current = tone.Transport.scheduleOnce(() => {
      tone.Draw.schedule(() => {
        onActiveNoteIdsChange([]);
      }, tone.now());
      setIsPlaying(false);
      partRef.current?.dispose();
      partRef.current = null;
      stopEventIdRef.current = null;
    }, latestEndTime + 0.1);

    tone.Transport.start();
    setIsPlaying(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full max-w-[180px]">
          <label className="mb-1 block text-sm font-medium text-gray-700">Tempo (BPM)</label>
          <Input value={playbackTempo} onChange={(event) => setPlaybackTempo(event.target.value)} inputMode="numeric" />
        </div>
        <div className="w-full max-w-[220px]">
          <label className="mb-1 block text-sm font-medium text-gray-700">Playback</label>
          <Select value={playbackTarget} onValueChange={(value) => setPlaybackTarget(value ?? "all")}>
            <SelectTrigger>
              <SelectValue>
                {playbackTarget === "all"
                  ? "All staffs"
                  : parsed.staves.find((staff) => staff.id === playbackTarget)?.label || "All staffs"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staffs</SelectItem>
              {parsed.staves.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={startPlayback} disabled={isPlaying || isLoadingInstrument || parsed.errors.length > 0}>
            {isLoadingInstrument ? "Loading piano..." : "Play"}
          </Button>
          <Button variant="outline" onClick={stopPlayback} disabled={!isPlaying}>
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
}
