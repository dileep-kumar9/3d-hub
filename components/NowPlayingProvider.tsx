"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Video } from "./VideoCard";

type NowPlayingContextType = {
  nowPlaying: Video | null;
  play: (video: Video) => void;
  stop: () => void;
};

const NowPlayingContext = createContext<NowPlayingContextType>({
  nowPlaying: null,
  play: () => {},
  stop: () => {},
});

export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState<Video | null>(null);

  return (
    <NowPlayingContext.Provider
      value={{
        nowPlaying,
        play: setNowPlaying,
        stop: () => setNowPlaying(null),
      }}
    >
      {children}
    </NowPlayingContext.Provider>
  );
}

export function useNowPlaying() {
  return useContext(NowPlayingContext);
}
