"use client";

import { useEffect, useRef, useState } from "react";
import { Video } from "./VideoCard";
import { useNowPlaying } from "./NowPlayingProvider";
import { useInfiniteVideos } from "@/lib/useInfiniteVideos";

type Props = {
  video: Video | null;
  onClose: () => void;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape" | "portrait") => Promise<void>;
  unlock?: () => void;
};

export default function VideoPlayer({ video, onClose }: Props) {
  const watchPageRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const relatedSentinelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const pushedHistoryRef = useRef(false);
  const relatedSearchIdRef = useRef<string | null>(null);
  const { pauseForOverlay, resumeFromOverlay } = useNowPlaying();

  const [activeVideo, setActiveVideo] = useState<Video | null>(video);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    videos: relatedVideos,
    loading: relatedLoading,
    search: searchRelated,
    loadMore: loadMoreRelated,
    hasMore: hasMoreRelated,
  } = useInfiniteVideos(video?.title || "", "", false);

  onCloseRef.current = onClose;
  const isVideoOpen = Boolean(video);

  useEffect(() => {
    setActiveVideo(video);
    relatedSearchIdRef.current = null;
  }, [video]);

  useEffect(() => {
    if (!activeVideo || !isVideoOpen) return;
    if (relatedSearchIdRef.current === activeVideo.id) return;

    relatedSearchIdRef.current = activeVideo.id;
    searchRelated(`${activeVideo.title} similar videos`);
  }, [activeVideo, isVideoOpen, searchRelated]);

  // A movie/video pauses persistent music without deleting the track or its
  // current position. When this player closes, the music remains paused.
  useEffect(() => {
    if (!isVideoOpen) return;

    pauseForOverlay();
    return () => resumeFromOverlay();
  }, [isVideoOpen, pauseForOverlay, resumeFromOverlay]);

  // Automatically request the next recommendations when the bottom of the
  // related list becomes visible inside this full-page player.
  useEffect(() => {
    const root = watchPageRef.current;
    const sentinel = relatedSentinelRef.current;

    if (!isVideoOpen || !root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreRelated();
        }
      },
      { root, rootMargin: "0px 0px 320px 0px", threshold: 0.01 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isVideoOpen, loadMoreRelated, relatedVideos.length]);

  // Make the mobile browser back gesture close only the player, preserving
  // the underlying page and its scroll position.
  useEffect(() => {
    if (!video) return;

    window.history.pushState({ videoOverlay: true }, "");
    pushedHistoryRef.current = true;

    function handlePopState() {
      pushedHistoryRef.current = false;
      onCloseRef.current();
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

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

      if (!fullscreenActive) {
        const orientation = screen.orientation as LockableOrientation;

        try {
          orientation?.unlock?.();
        } catch (error) {
          console.log("Orientation unlock is not supported:", error);
        }
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.fullscreenElement) {
        onCloseRef.current();
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
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

      const orientation = screen.orientation as LockableOrientation;

      try {
        orientation?.unlock?.();
      } catch {
        // Ignore unsupported browser behavior.
      }
    };
  }, [video]);

  if (!video || !activeVideo) {
    return null;
  }

  async function toggleFullscreen() {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (!document.fullscreenElement) {
        await player.requestFullscreen();

        const orientation = screen.orientation as LockableOrientation;
        if (orientation?.lock) {
          try {
            await orientation.lock("landscape");
          } catch (error) {
            console.log("Landscape lock is not supported:", error);
          }
        }
      } else {
        await document.exitFullscreen();

        const orientation = screen.orientation as LockableOrientation;
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

    const orientation = screen.orientation as LockableOrientation;
    try {
      orientation?.unlock?.();
    } catch {
      // Ignore unsupported browser behavior.
    }

    onClose();
  }

  function playRelated(nextVideo: Video) {
    setActiveVideo({
      ...nextVideo,
      section: activeVideo?.section || nextVideo.section || "home",
      mediaType: "video",
    });

    window.requestAnimationFrame(() => {
      watchPageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const visibleRelatedVideos = relatedVideos.filter(
    (item) => item.id !== activeVideo.id
  );

  return (
    <div ref={watchPageRef} className="watch-page">
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
              isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
            }
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? "🗗 Exit fullscreen" : "⛶ Fullscreen"}
          </button>
        </div>

        <div ref={playerRef} className="watch-player">
          <iframe
            key={activeVideo.id}
            src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
            title={activeVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>

        <section className="watch-details watch-details-compact">
          <div className="watch-details-copy">
            <h1>{activeVideo.title}</h1>
            {activeVideo.channel && (
              <p className="watch-channel">{activeVideo.channel}</p>
            )}
          </div>

          <div className="watch-actions">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="watch-action-primary"
            >
              {isFullscreen ? "🗗 Exit fullscreen" : "⛶ Fullscreen"}
            </button>

            <a
              href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="watch-action-secondary"
            >
              Open on YouTube
            </a>
          </div>
        </section>

        <section className="watch-related" aria-label="Similar videos">
          <div className="watch-related-heading">
            <div>
              <h2>Similar videos</h2>
              <p>More recommendations load as you scroll.</p>
            </div>
          </div>

          <div className="watch-related-grid">
            {visibleRelatedVideos.map((item) => (
              <button
                type="button"
                className="watch-related-card"
                key={item.id}
                onClick={() => playRelated(item)}
              >
                <img src={item.thumbnail} alt="" loading="lazy" />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.channel}</small>
                </span>
              </button>
            ))}
          </div>

          <div ref={relatedSentinelRef} className="watch-related-sentinel" />

          {relatedLoading && (
            <p className="watch-related-status">Loading similar videos...</p>
          )}

          {!relatedLoading && hasMoreRelated && (
            <button
              type="button"
              className="watch-related-load-more"
              onClick={loadMoreRelated}
            >
              Load more similar videos
            </button>
          )}

          {!relatedLoading && visibleRelatedVideos.length === 0 && (
            <p className="watch-related-status">
              Looking for similar videos...
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
