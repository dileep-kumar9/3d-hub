"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNowPlaying } from "./NowPlayingProvider";

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
  const { nowPlaying, stop } = useNowPlaying();

  const playerContainerRef =
    useRef<HTMLDivElement>(null);

  const playerRef = useRef<any>(null);
  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] =
    useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] =
    useState(false);
  const [seekValue, setSeekValue] =
    useState(0);

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

  return (
    <section className="mini-player">
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
