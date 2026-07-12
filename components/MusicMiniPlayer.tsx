"use client";

import MiniPlayer from "./MiniPlayer";
import { useNowPlaying } from "./NowPlayingProvider";

export default function MusicMiniPlayer() {
  const { nowPlaying } = useNowPlaying();

  if (!nowPlaying) {
    return null;
  }

  const section = (nowPlaying.section || "").toLowerCase();
  const isAudioContent =
    nowPlaying.mediaType === "music" ||
    nowPlaying.mediaType === "audio" ||
    section === "music" ||
    section === "immersive audio" ||
    section === "immersive-audio";

  return isAudioContent ? <MiniPlayer /> : null;
}
