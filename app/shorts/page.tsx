"use client";

import { useState } from "react";

import ShortsRow from "@/components/ShortsRow";
import VideoPlayer from "@/components/VideoPlayer";
import type { Video } from "@/components/VideoCard";
import { useAuth } from "@/components/AuthProvider";
import { logHistory } from "@/lib/history";

export default function ShortsPage() {
  const { user } = useAuth();
  const [playing, setPlaying] = useState<Video | null>(null);

  function handlePlay(video: Video) {
    setPlaying(video);
    logHistory(user, video, "home");
  }

  function handleWatch(video: Video) {
    logHistory(user, video, "home");
  }

  return (
    <main className="shorts-page">
      <ShortsRow onPlay={handlePlay} onWatch={handleWatch} />

      <VideoPlayer
        video={playing}
        onClose={() => setPlaying(null)}
      />
    </main>
  );
}
