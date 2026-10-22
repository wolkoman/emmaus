import { cacheLife } from "next/dist/server/use-cache/cache-life";

const VIDEOS_BASE = "https://api.emmaus.wien/videos/";

export type Video = {
  title: string;
  date?: string;
  description?: string;
  offlineAt?: string;
  poster?: string;
  sources: Record<string, string>;
  download?: string;
};

/** Reads `<slug>/video.json` from api.emmaus.wien; file names in it are relative to that folder. */
export async function fetchVideo(slug: string): Promise<Video | undefined> {
  "use cache";
  cacheLife("minutes");

  // The slug becomes part of a URL we fetch, so never let it leave /videos/.
  if (!/^[A-Za-z0-9-]+$/.test(slug)) return undefined;
  const folder = new URL(`${slug}/`, VIDEOS_BASE);
  const res = await fetch(new URL("video.json", folder));
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`video.json for ${slug}: HTTP ${res.status}`);

  const video: Video = await res.json();
  if (!video.title || !video.sources || !Object.keys(video.sources).length) {
    throw new Error(`video.json for ${slug} needs "title" and "sources"`);
  }
  const resolve = (file: string) => new URL(file, folder).toString();
  return {
    ...video,
    poster: video.poster && resolve(video.poster),
    sources: Object.fromEntries(
      Object.entries(video.sources).map(([label, file]) => [
        label,
        resolve(file),
      ]),
    ),
    download: video.download && `${resolve(video.download)}?download`,
  };
}
