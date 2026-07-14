"use client";

import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { Video } from "./VideoCard";

type NowPlayingContextType = {
  nowPlaying: Video | null;
  play: (video: Video) => void;
  stop: () => void;
  pausedByOverlay: boolean;
  pauseForOverlay: () => void;
  resumeFromOverlay: () => void;
};

const NowPlayingContext = createContext<NowPlayingContextType>({
  nowPlaying: null,
  play: () => {},
  stop: () => {},
  pausedByOverlay: false,
  pauseForOverlay: () => {},
  resumeFromOverlay: () => {},
});

export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState<Video | null>(null);
  const [pausedByOverlay, setPausedByOverlay] = useState(false);
  // Multiple overlays can be open at once (e.g. opening the full player
  // from inside the Shorts feed). A plain boolean would let the inner
  // overlay's close wrongly resume music while the outer one is still
  // open, so track how many overlays currently want music paused instead.
  const overlayPauseCountRef = useRef(0);

  return (
    <NowPlayingContext.Provider
      value={{
        nowPlaying,
        play: (video) => {
          setPausedByOverlay(false);
          overlayPauseCountRef.current = 0;
          setNowPlaying(video);
        },
        stop: () => {
          setPausedByOverlay(false);
          overlayPauseCountRef.current = 0;
          setNowPlaying(null);
        },
        pausedByOverlay,
        // Used when a video/Short opens elsewhere in the app: pause the
        // music in place (keeping its track and position) instead of
        // stopping it outright.
        pauseForOverlay: () => {
          overlayPauseCountRef.current += 1;
          setPausedByOverlay(true);
        },
        // Used when that video/Short closes: only resumes once every
        // overlay that asked for a pause has released it, and even then
        // only if the music was actually playing when we paused it (see
        // MiniPlayer, which ignores this if the person had already
        // paused the music themselves).
        resumeFromOverlay: () => {
          overlayPauseCountRef.current = Math.max(
            0,
            overlayPauseCountRef.current - 1
          );
          setPausedByOverlay(
            overlayPauseCountRef.current > 0
          );
        },
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}

export function useNowPlaying() {
  return useContext(NowPlayingContext);
}
