"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNowPlaying } from "./NowPlayingProvider";
import { useInfiniteVideos } from "@/lib/useInfiniteVideos";
import type { Video } from "./VideoCard";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const { nowPlaying, play, stop, pausedByOverlay } = useNowPlaying();

  const playerContainerRef =
    useRef<HTMLDivElement>(null);

  const playerRef = useRef<any>(null);
  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(true);
  const wasPlayingBeforeOverlayRef = useRef(false);
  const [currentTime, setCurrentTime] =
    useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] =
    useState(false);
  const [seekValue, setSeekValue] =
    useState(0);
  const [similarExpanded, setSimilarExpanded] =
    useState(false);

  isPlayingRef.current = isPlaying;

  const {
    videos: similarVideos,
    loading: similarLoading,
    search: searchSimilar,
    loadMore: loadMoreSimilar,
    hasMore: hasMoreSimilar,
  } = useInfiniteVideos(nowPlaying?.title || "");

  const lastSimilarSearchIdRef = useRef(
    nowPlaying?.id
  );
  const similarListRef = useRef<HTMLDivElement>(null);
  const similarSentinelRef = useRef<HTMLDivElement>(null);

  // Whenever the playing track changes, refresh the similar-videos list to
  // match it (the hook only auto-fetches once, on this component's first
  // mount, so later track changes need an explicit re-search).
  useEffect(() => {
    if (
      !nowPlaying ||
      lastSimilarSearchIdRef.current === nowPlaying.id
    ) {
      return;
    }

    lastSimilarSearchIdRef.current = nowPlaying.id;
    searchSimilar(nowPlaying.title);
  }, [nowPlaying, searchSimilar]);

  // Auto-load more similar videos as the person scrolls near the bottom of
  // the list, the way YouTube's own "up next" list does.
  useEffect(() => {
    const list = similarListRef.current;
    const sentinel = similarSentinelRef.current;

    if (!similarExpanded || !list || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreSimilar();
        }
      },
      { root: list, threshold: 0.1 }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [similarExpanded, loadMoreSimilar]);

  useEffect(() => {
    if (!nowPlaying) {
      return;
    }

    let cancelled = false;

    function loadYouTubeAPI() {
      return new Promise<void>((resolve) => {
        if (window.YT?.Player) {
          resolve();
          return;
        }

        const existingScript =
          document.querySelector<HTMLScriptElement>(
            'script[src="https://www.youtube.com/iframe_api"]'
          );

        const previousCallback =
          window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady = () => {
          previousCallback?.();
          resolve();
        };

        if (!existingScript) {
          const script =
            document.createElement("script");

          script.src =
            "https://www.youtube.com/iframe_api";

          script.async = true;

          document.body.appendChild(script);
        }
      });
    }

    async function createPlayer() {
      await loadYouTubeAPI();

      if (
        cancelled ||
        !playerContainerRef.current
      ) {
        return;
      }

      playerRef.current?.destroy?.();

      playerContainerRef.current.innerHTML = "";

      const playerElement =
        document.createElement("div");

      playerElement.id = `mini-youtube-player-${nowPlaying.id}`;

      playerContainerRef.current.appendChild(
        playerElement
      );

      playerRef.current = new window.YT.Player(
        playerElement,
        {
          videoId: nowPlaying.id,

          width: "100%",
          height: "100%",

          playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },

          events: {
            onReady: (event: any) => {
              if (cancelled) return;

              setIsReady(true);
              setIsPlaying(true);

              const videoDuration =
                event.target.getDuration?.() || 0;

              setDuration(videoDuration);

              event.target.playVideo?.();
            },

            onStateChange: (event: any) => {
              if (!window.YT) return;

              setIsPlaying(
                event.data ===
                  window.YT.PlayerState.PLAYING
              );

              if (
                event.data ===
                window.YT.PlayerState.ENDED
              ) {
                setCurrentTime(0);
                setSeekValue(0);
              }
            },
          },
        }
      );
    }

    createPlayer();

    return () => {
      cancelled = true;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      playerRef.current?.destroy?.();
      playerRef.current = null;

      setIsReady(false);
      setCurrentTime(0);
      setDuration(0);
      setSeekValue(0);
    };
  }, [nowPlaying?.id]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isReady) return;

    if (pausedByOverlay) {
      wasPlayingBeforeOverlayRef.current =
        isPlayingRef.current;

      if (isPlayingRef.current) {
        player.pauseVideo?.();
      }
    } else if (
      wasPlayingBeforeOverlayRef.current
    ) {
      wasPlayingBeforeOverlayRef.current = false;
      player.playVideo?.();
    }
  }, [pausedByOverlay, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const player = playerRef.current;

      if (!player?.getCurrentTime) {
        return;
      }

      const updatedCurrentTime =
        player.getCurrentTime() || 0;

      const updatedDuration =
        player.getDuration?.() || 0;

      if (!isSeeking) {
        setCurrentTime(updatedCurrentTime);
        setSeekValue(updatedCurrentTime);
      }

      if (updatedDuration > 0) {
        setDuration(updatedDuration);
      }
    }, 500);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isReady, isSeeking]);

  if (!nowPlaying) {
    return null;
  }

  function togglePlayback() {
    const player = playerRef.current;

    if (!player) return;

    if (isPlaying) {
      player.pauseVideo?.();
    } else {
      player.playVideo?.();
    }
  }

  function handleSeekChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);

    setIsSeeking(true);
    setSeekValue(value);
    setCurrentTime(value);
  }

  function finishSeeking() {
    playerRef.current?.seekTo?.(
      seekValue,
      true
    );

    setCurrentTime(seekValue);
    setIsSeeking(false);
  }

  function skip(seconds: number) {
    const player = playerRef.current;

    if (!player) return;

    const nextTime = Math.min(
      Math.max(
        (player.getCurrentTime?.() || 0) +
          seconds,
        0
      ),
      duration || Number.MAX_SAFE_INTEGER
    );

    player.seekTo?.(nextTime, true);

    setCurrentTime(nextTime);
    setSeekValue(nextTime);
  }

  function handleStop() {
    playerRef.current?.stopVideo?.();
    stop();
  }

  function playSimilar(video: Video) {
    play({
      ...video,
      section: "music",
      mediaType: "music",
    });
  }

  return (
    <section className="mini-player">
      {similarExpanded && (
        <div className="mini-player-similar-panel">
          <div className="mini-player-similar-header">
            <h3>Similar videos</h3>
            <button
              type="button"
              onClick={() => setSimilarExpanded(false)}
              aria-label="Close similar videos"
            >
              ✕
            </button>
          </div>

          <div
            className="mini-player-similar-list"
            ref={similarListRef}
          >
            {similarVideos
              .filter((video) => video.id !== nowPlaying.id)
              .map((video) => (
                <button
                  type="button"
                  key={video.id}
                  className="mini-player-similar-item"
                  onClick={() => playSimilar(video)}
                >
                  <img
                    src={video.thumbnail}
                    alt=""
                    loading="lazy"
                  />
                  <span>
                    <strong>{video.title}</strong>
                    <small>{video.channel}</small>
                  </span>
                </button>
              ))}

            <div
              ref={similarSentinelRef}
              className="mini-player-similar-sentinel"
            />

            {similarLoading && (
              <p className="mini-player-similar-status">
                Loading more...
              </p>
            )}

            {!similarLoading &&
              !hasMoreSimilar &&
              similarVideos.length > 0 && (
                <p className="mini-player-similar-status">
                  No more similar videos.
                </p>
              )}
          </div>
        </div>
      )}

      <div className="mini-player-main">
        <img
          src={nowPlaying.thumbnail}
          alt={nowPlaying.title}
          className="mini-player-thumbnail"
        />

        <div className="mini-player-info">
          <p className="mini-player-title">
            {nowPlaying.title}
          </p>

          <p className="mini-player-channel">
            {nowPlaying.channel}
          </p>
        </div>

        <div className="mini-player-controls">
          <button
            type="button"
            onClick={() => skip(-10)}
            className="mini-control-button"
            aria-label="Go back 10 seconds"
            title="Back 10 seconds"
          >
            ↶ 10
          </button>

          <button
            type="button"
            onClick={togglePlayback}
            className="mini-play-button"
            disabled={!isReady}
            aria-label={
              isPlaying
                ? "Pause music"
                : "Play music"
            }
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <button
            type="button"
            onClick={() => skip(10)}
            className="mini-control-button"
            aria-label="Go forward 10 seconds"
            title="Forward 10 seconds"
          >
            10 ↷
          </button>

          <button
            type="button"
            onClick={() =>
              setSimilarExpanded(
                (current) => !current
              )
            }
            className={`mini-control-button mini-similar-toggle${
              similarExpanded ? " expanded" : ""
            }`}
            aria-label={
              similarExpanded
                ? "Hide similar videos"
                : "Show similar videos"
            }
            aria-expanded={similarExpanded}
            title={
              similarExpanded
                ? "Hide similar videos"
                : "Show similar videos"
            }
          >
            ⌃
          </button>
        </div>

        <div
          ref={playerContainerRef}
          className="mini-player-youtube"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={handleStop}
          className="mini-stop-button"
        >
          ✕
          <span>Stop</span>
        </button>
      </div>

      <div className="mini-player-progress-row">
        <span className="mini-player-time">
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={
            Math.min(
              seekValue,
              duration || seekValue
            ) || 0
          }
          onChange={handleSeekChange}
          onMouseUp={finishSeeking}
          onTouchEnd={finishSeeking}
          onKeyUp={finishSeeking}
          disabled={!isReady || duration <= 0}
          className="mini-player-slider"
          aria-label="Music playback position"
        />

        <span className="mini-player-time">
          {formatTime(duration)}
        </span>
      </div>
    </section>
  );
}
