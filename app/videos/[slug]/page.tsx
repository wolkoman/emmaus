import Site from "@/components/Site";
import { Loading } from "@/components/Loading";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { fetchVideo } from "./fetchVideo";
import { VideoPlayer } from "./VideoPlayer";

type VideoParams = { params: Promise<{ slug: string }> };

const formatDate = (date: Date) =>
  date.toLocaleDateString("de-AT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Vienna",
  });

export async function generateMetadata(props: VideoParams): Promise<Metadata> {
  const video = await fetchVideo((await props.params).slug);
  return {
    title: video && `${video.title} | Emmaus`,
    description: video?.description?.slice(0, 160),
    robots: { index: false, follow: false },
    openGraph: video && {
      title: video.title,
      description: video.description?.slice(0, 160),
      images: video.poster,
    },
  };
}

export default function VideoPage(props: VideoParams) {
  return (
    <Site>
      <Suspense fallback={<Loading />}>
        <VideoContent params={props.params} />
      </Suspense>
    </Site>
  );
}

async function VideoContent(props: VideoParams) {
  const video = await fetchVideo((await props.params).slug);
  if (!video) notFound();

  await connection();
  const offlineAt = video.offlineAt ? new Date(video.offlineAt) : undefined;
  if (offlineAt && Date.now() >= offlineAt.getTime()) {
    return (
      <div className="my-12 text-lg">
        Dieses Video ist nicht mehr verfügbar.
      </div>
    );
  }

  return (
    <div className="my-6 flex flex-col gap-4 lg:my-10">
      <VideoPlayer
        poster={video.poster}
        sources={video.sources}
        download={video.download}
        title={video.title}
      />
      {(video.date || video.description || offlineAt) && (
        <div className="rounded-xl bg-black/5 p-4">
          {video.date && (
            <div className="font-semibold">
              {formatDate(new Date(video.date))}
            </div>
          )}
          {video.description && (
            <p className="mt-1 whitespace-pre-line">{video.description}</p>
          )}
          {offlineAt && (
            <p className="mt-3 text-sm text-gray-600">
              Online bis einschließlich{" "}
              {formatDate(new Date(offlineAt.getTime() - 1))}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
