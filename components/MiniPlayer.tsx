"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Video } from "./VideoCard";"use client";

import { useEffect, useRef, useState } from "react";
import { Video } from "./VideoCard";
import { useNowPlaying } from "./NowPlayingProvider";

type Props = {
  video: Video | null;
  onClose: () => void;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape" | "portrait") => Promise<void>;
  unlock?: () => void;
};

export default function VideoPlayer({
  video,
  onClose,
}: Props) {
  const playerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const pushedHistoryRef = useRef(false);
  const { pauseForOverlay, resumeFromOverlay } = useNowPlaying();

  onCloseRef.current = onClose;

  const [isFullscreen, setIsFullscreen] = useState(false);

  const isVideoOpen = Boolean(video);

  // A normal video temporarily takes over playback. Keep the current music
  // track, position and manual play/pause state intact so it can continue
  // exactly as it was when the video overlay closes.
  useEffect(() => {
    if (!isVideoOpen) return;

    pauseForOverlay();

    return () => {
      resumeFromOverlay();
    };
  }, [isVideoOpen, pauseForOverlay, resumeFromOverlay]);

  // On mobile, the hardware/gesture back button fires a normal browser
  // "back" navigation. Without this, that would leave the current page
  // entirely (losing whatever search results or scroll position were
  // behind the video) instead of just closing the video overlay. Pushing a
  // history entry when the video opens lets us intercept that back press
  // with popstate and simply close the overlay, so the page underneath
  // (and where the user was) is exactly as they left it.
  useEffect(() => {
    if (!video) return;

    window.history.pushState(
      { videoOverlay: true },
      ""
    );
    pushedHistoryRef.current = true;

    function handlePopState() {
      pushedHistoryRef.current = false;
      onCloseRef.current();
    }

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );

      // Closed via our own UI (not the back button) — remove the extra
      // history entry we added so the next back press behaves normally
      // instead of just re-closing an already-closed player.
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        window.history.back();
      }
    };
  }, [video]);

  useEffect(() => {
    function handleFullscreenChange() {
      const fullscreenActive =
        document.fullscreenElement === playerRef.current;

      setIsFullscreen(fullscreenActive);

      // Return to the device's normal orientation after fullscreen closes.
      if (!fullscreenActive) {
        const orientation =
          screen.orientation as LockableOrientation;

        try {
          orientation?.unlock?.();
        } catch (error) {
          console.log(
            "Orientation unlock is not supported:",
            error
          );
        }
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    window.addEventListener("keydown", handleEscape);

    if (video) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      window.removeEventListener("keydown", handleEscape);

      document.body.style.overflow = "";

      const orientation =
        screen.orientation as LockableOrientation;

      try {
        orientation?.unlock?.();
      } catch {
        // Ignore unsupported browser behavior.
      }
    };
  }, [video, onClose]);

  if (!video) {
    return null;
  }

  async function toggleFullscreen() {
    const player = playerRef.current;

    if (!player) return;

    try {
      if (!document.fullscreenElement) {
        await player.requestFullscreen();

        const orientation =
          screen.orientation as LockableOrientation;

        if (orientation?.lock) {
          try {
            await orientation.lock("landscape");
          } catch (error) {
            // Fullscreen can still work even when orientation locking fails.
            console.log(
              "Landscape lock is not supported:",
              error
            );
          }
        }
      } else {
        await document.exitFullscreen();

        const orientation =
          screen.orientation as LockableOrientation;

        try {
          orientation?.unlock?.();
        } catch {
          // Ignore unsupported browser behavior.
        }
      }
    } catch (error) {
      console.error("Fullscreen operation failed:", error);
    }
  }

  async function handleClose() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Could not exit fullscreen:", error);
    }

    const orientation =
      screen.orientation as LockableOrientation;

    try {
      orientation?.unlock?.();
    } catch {
      // Ignore unsupported browser behavior.
    }

    onClose();
  }

  return (
    <div className="watch-page">
      <div className="watch-page-content">
        <div className="watch-page-toolbar">
          <button
            type="button"
            onClick={handleClose}
            className="watch-back-button"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="watch-fullscreen-button"
            aria-label={
              isFullscreen
                ? "Exit fullscreen"
                : "Enter fullscreen"
            }
            title={
              isFullscreen
                ? "Exit fullscreen"
                : "Enter fullscreen"
            }
          >
            {isFullscreen
              ? "🗗 Exit fullscreen"
              : "⛶ Fullscreen"}
          </button>
        </div>

        <div
          ref={playerRef}
          className="watch-player"
        >
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>

        <section className="watch-details">
          <h1>{video.title}</h1>

          {video.channel && (
            <p className="watch-channel">
              {video.channel}
            </p>
          )}

          <div className="watch-actions">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="watch-action-primary"
            >
              {isFullscreen
                ? "🗗 Exit fullscreen"
                : "⛶ Watch fullscreen"}
            </button>

            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="watch-action-secondary">
              Open on YouTube
            </a>
          </div>

          <div className="watch-description">
            <h2>About this video</h2>

            <p>
              This video is streamed through the official YouTube
              embedded player. Video availability and playback are
              controlled by YouTube and the content owner.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}


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
