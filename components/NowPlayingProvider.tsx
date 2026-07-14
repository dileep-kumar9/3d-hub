"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
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

  // More than one playback surface can request that the persistent music
  // player pause. Counting those requests prevents an inner surface from
  // resuming music while another video or Shorts feed is still open.
  const overlayPauseCountRef = useRef(0);

  const play = useCallback((video: Video) => {
    setPausedByOverlay(false);
    overlayPauseCountRef.current = 0;
    setNowPlaying(video);
  }, []);

  const stop = useCallback(() => {
    setPausedByOverlay(false);
    overlayPauseCountRef.current = 0;
    setNowPlaying(null);
  }, []);

  const pauseForOverlay = useCallback(() => {
    overlayPauseCountRef.current += 1;
    setPausedByOverlay(true);
  }, []);

  const resumeFromOverlay = useCallback(() => {
    overlayPauseCountRef.current = Math.max(
      0,
      overlayPauseCountRef.current - 1
    );

    setPausedByOverlay(overlayPauseCountRef.current > 0);
  }, []);

  return (
    <NowPlayingContext.Provider
      value={{
        nowPlaying,
        play,
        stop,
        pausedByOverlay,
        pauseForOverlay,
        resumeFromOverlay,
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}

export function useNowPlaying() {
  return useContext(NowPlayingContext);
}
