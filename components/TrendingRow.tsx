"use client";

import { useEffect, useState } from "react";
import ContentRow from "./ContentRow";
import type { Video } from "./VideoCard";

type TrendingSection =
  | "home"
  | "movies"
  | "music"
  | "kids"
  | "3d"
  | "immersive-audio";

type Props = {
  title: string;
  section: TrendingSection;
  onPlay: (video: Video) => void;
};

function sectionMetadata(section: TrendingSection) {
  if (section === "music") {
    return { section: "music", mediaType: "music" as const };
  }

  if (section === "immersive-audio") {
    return {
      section: "immersive audio",
      mediaType: "audio" as const,
    };
  }

  if (section === "3d") {
    return { section: "3d videos", mediaType: "video" as const };
  }

  return { section, mediaType: "video" as const };
}

export default function TrendingRow({
  title,
  section,
  onPlay,
}: Props) {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTrending() {
      try {
        const response = await fetch(
          `/api/youtube?mode=trending&section=${encodeURIComponent(section)}`,
          { signal: controller.signal }
        );

        if (!response.ok) return;

        const data = await response.json();
        if (data.isFallback || !Array.isArray(data.videos)) return;

        const metadata = sectionMetadata(section);
        const seen = new Set<string>();
        const nextVideos = (data.videos as Video[])
          .filter((video) => {
            if (!video?.id || seen.has(video.id)) return false;
            seen.add(video.id);
            return true;
          })
          .slice(0, 12)
          .map((video) => ({
            ...video,
            ...metadata,
          }));

        if (!controller.signal.aborted) {
          setVideos(nextVideos);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Trending content could not be loaded:", error);
        }
      }
    }

    loadTrending();
    return () => controller.abort();
  }, [section]);

  return <ContentRow title={title} videos={videos} onPlay={onPlay} />;
}
