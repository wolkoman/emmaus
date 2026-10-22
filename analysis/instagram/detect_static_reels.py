# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "imagehash",
#   "Pillow",
# ]
# ///
"""Detect which reels are effectively static images (photo + music).

For each .mp4 in the scrape directory:
  - read duration via ffprobe
  - extract frames at 25%, 50%, 75% via ffmpeg to /tmp
  - compute perceptual hash (pHash) of each
  - compute pairwise hamming distances
  - classify as static when max pairwise distance <= STATIC_THRESHOLD

Output: JSON file with per-media-id results.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import imagehash
from PIL import Image

SCRAPE_DIR = Path("/Users/manuel/Projects/emmaus/instagram-scrape/pfarreemmaus")
OUTPUT = Path(
    "/Users/manuel/Projects/emmaus/analysis/instagram/cache/reel-motion.json"
)

# pHash is 64 bits. Two near-identical photos typically differ by <= 4 bits.
# Videos with actual motion usually exceed 10 bits.
STATIC_THRESHOLD = 6


def get_duration(mp4: Path) -> float | None:
    try:
        out = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(mp4),
            ],
            stderr=subprocess.DEVNULL,
        )
        return float(out.strip())
    except Exception:
        return None


def extract_frame(mp4: Path, at_seconds: float, out_path: Path) -> bool:
    try:
        subprocess.check_call(
            [
                "ffmpeg",
                "-nostdin",
                "-loglevel",
                "error",
                "-ss",
                f"{at_seconds:.2f}",
                "-i",
                str(mp4),
                "-frames:v",
                "1",
                "-q:v",
                "5",
                "-y",
                str(out_path),
            ],
        )
        return out_path.exists() and out_path.stat().st_size > 0
    except Exception:
        return False


def analyze_reel(mp4: Path, tmp_dir: Path) -> dict | None:
    duration = get_duration(mp4)
    if duration is None or duration < 1.0:
        return None

    ratios = [0.25, 0.50, 0.75]
    frame_paths: list[Path] = []
    for i, r in enumerate(ratios):
        out = tmp_dir / f"{mp4.stem}_{i}.jpg"
        if extract_frame(mp4, duration * r, out):
            frame_paths.append(out)

    if len(frame_paths) < 3:
        return {
            "duration": duration,
            "frames_extracted": len(frame_paths),
            "error": "frame extraction failed",
        }

    hashes = []
    for p in frame_paths:
        try:
            hashes.append(imagehash.phash(Image.open(p)))
        except Exception as e:
            return {"duration": duration, "error": f"hash failed: {e}"}

    d01 = int(hashes[0] - hashes[1])
    d02 = int(hashes[0] - hashes[2])
    d12 = int(hashes[1] - hashes[2])
    max_distance = max(d01, d02, d12)
    avg_distance = (d01 + d02 + d12) / 3

    for p in frame_paths:
        p.unlink(missing_ok=True)

    return {
        "duration": round(duration, 2),
        "distances": [d01, d02, d12],
        "max_distance": max_distance,
        "avg_distance": round(avg_distance, 2),
        "is_static": max_distance <= STATIC_THRESHOLD,
    }


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    existing: dict[str, dict] = {}
    if OUTPUT.exists():
        existing = json.loads(OUTPUT.read_text())
        print(f"Loaded {len(existing)} cached results")

    mp4s = sorted(SCRAPE_DIR.glob("*.mp4"))
    print(f"Found {len(mp4s)} reels")

    with tempfile.TemporaryDirectory() as td:
        tmp_dir = Path(td)
        processed = 0
        static_count = 0
        for i, mp4 in enumerate(mp4s):
            media_id = mp4.stem
            if media_id in existing:
                if existing[media_id].get("is_static"):
                    static_count += 1
                continue

            result = analyze_reel(mp4, tmp_dir)
            if result is None:
                continue
            existing[media_id] = result
            if result.get("is_static"):
                static_count += 1
            processed += 1

            if processed % 10 == 0:
                OUTPUT.write_text(json.dumps(existing, indent=2))
                print(f"  [{i + 1}/{len(mp4s)}] processed={processed} static={static_count}")

    OUTPUT.write_text(json.dumps(existing, indent=2))

    total = len(existing)
    static = sum(1 for v in existing.values() if v.get("is_static"))
    motion = total - static
    print(f"\nDone. Total: {total}, Static: {static} ({static/total*100:.0f}%), Motion: {motion}")


if __name__ == "__main__":
    main()
