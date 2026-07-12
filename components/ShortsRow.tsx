"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Video } from "./VideoCard";
import { useLibrary } from "./LibraryProvider";

type ShortsCategory =
  | "comedy"
  | "music"
  | "movies"
  | "dance"
  | "kids"
  | "animation"
  | "gaming"
  | "facts"
  | "food"
  | "travel"
  | "tech"
  | "vlog"
  | "devotional"
  | "motivation"
  | "education"
  | "sports"
  | "culture"
  | "cooking"
  | "science"
  | "fitness"
  | "nature"
  | "art"
  | "lifestyle"
  | "entertainment";

type ShortVideo = Video & {
  shortsCategory?: ShortsCategory;
};

type ShortEngagement = {
  video: ShortVideo;
  watchedSeconds: number;
  duration: number;
  completed: boolean;
};

type CategorySignals = {
  views: number;
  strongViews: number;
  quickSkips: number;
  totalWatchRatio: number;
};

const MIN_SHORTS_BEFORE_PERSONALIZING = 6;

type Props = {
  onPlay: (video: Video) => void;
  onWatch?: (video: Video) => void;
};

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getPlaybackRate: () => number;
  getAvailablePlaybackRates: () => number[];
  isMuted: () => boolean;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  unMute: () => void;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: { target: YouTubePlayer }) => void;
        onStateChange?: (event: {
          data: number;
          target: YouTubePlayer;
        }) => void;
        onError?: () => void;
      };
    }
  ) => YouTubePlayer;
};

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("YouTube player is only available in the browser.")
    );
  }

  // Keep the YouTube API type local to this component. The project already
  // declares window.YT in MiniPlayer.tsx, so another global declaration here
  // would cause TypeScript's "subsequent property declarations" error.
  const youtubeWindow = window as typeof window & {
    YT?: YouTubeNamespace;
  };

  if (youtubeWindow.YT?.Player) {
    return Promise.resolve(youtubeWindow.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("Unable to load YouTube player."));
      document.head.appendChild(script);
    }

    const startedAt = Date.now();
    const timer = youtubeWindow.setInterval(() => {
      if (youtubeWindow.YT?.Player) {
        youtubeWindow.clearInterval(timer);
        resolve(youtubeWindow.YT);
        return;
      }

      if (Date.now() - startedAt > 12000) {
        youtubeWindow.clearInterval(timer);
        youtubeApiPromise = null;
        reject(new Error("YouTube player timed out."));
      }
    }, 100);
  });

  return youtubeApiPromise;
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function shuffleVideos(items: ShortVideo[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

type ReelPlayerProps = {
  video: ShortVideo;
  muted: boolean;
  onEnded: () => void;
  onEngagement: (engagement: ShortEngagement) => void;
  onMutedChange: (muted: boolean) => void;
  onOpen: () => void;
  onStarted: () => void;
};

function ReelPlayer({
  video,
  muted,
  onEnded,
  onEngagement,
  onMutedChange,
  onOpen,
  onStarted,
}: ReelPlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedCoverRef = useRef<HTMLImageElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const engagementReportedRef = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const mutedPreferenceRef = useRef(muted);
  const onEndedRef = useRef(onEnded);
  const onEngagementRef = useRef(onEngagement);
  const onStartedRef = useRef(onStarted);

  mutedPreferenceRef.current = muted;
  onEndedRef.current = onEnded;
  onEngagementRef.current = onEngagement;
  onStartedRef.current = onStarted;

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [availablePlaybackRates, setAvailablePlaybackRates] =
    useState<number[]>([0.5, 1, 1.25, 1.5, 2]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playerError, setPlayerError] = useState(false);

  const reportEngagement = useCallback(
    (completed: boolean) => {
      if (
        engagementReportedRef.current ||
        !startedRef.current
      ) {
        return;
      }

      const player = playerRef.current;
      const duration =
        player?.getDuration() ||
        durationRef.current;
      const watchedSeconds = completed
        ? duration
        : player?.getCurrentTime() ||
          currentTimeRef.current;

      if (
        !Number.isFinite(duration) ||
        duration <= 0 ||
        !Number.isFinite(watchedSeconds)
      ) {
        return;
      }

      engagementReportedRef.current = true;

      onEngagementRef.current({
        video,
        watchedSeconds: Math.max(
          0,
          Math.min(
            watchedSeconds,
            duration
          )
        ),
        duration,
        completed,
      });
    },
    [video]
  );

  useEffect(() => {
    let cancelled = false;

    async function createPlayer() {
      try {
        const YT = await loadYouTubeIframeApi();

        if (cancelled || !mountRef.current) return;

        playerRef.current = new YT.Player(mountRef.current, {
          videoId: video.id,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            showinfo: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;

              if (mutedPreferenceRef.current) {
                target.mute();
              } else {
                target.unMute();
              }

              const supportedRates =
                target.getAvailablePlaybackRates?.() || [];
              const usableRates =
                supportedRates.length > 0
                  ? supportedRates
                  : [0.5, 1, 1.25, 1.5, 2];

              setAvailablePlaybackRates(usableRates);

              target.setPlaybackRate(1);
              setPlaybackRate(1);

              target.playVideo();
              const loadedDuration =
                target.getDuration() || 0;

              durationRef.current =
                loadedDuration;
              setPlaying(true);
              setDuration(loadedDuration);
              setReady(true);

              if (pausedCoverRef.current) {
                pausedCoverRef.current.style.opacity = "0";
                pausedCoverRef.current.style.visibility = "hidden";
              }

              if (!startedRef.current) {
                startedRef.current = true;
                onStartedRef.current();
              }

              progressTimerRef.current = window.setInterval(() => {
                const player = playerRef.current;
                if (!player) return;

                const nextCurrentTime =
                  player.getCurrentTime() || 0;
                const nextDuration =
                  player.getDuration() || 0;

                currentTimeRef.current =
                  nextCurrentTime;
                durationRef.current =
                  nextDuration;
                setCurrentTime(nextCurrentTime);
                setDuration(nextDuration);
                setPlaying(player.getPlayerState() === 1);
              }, 300);
            },
            onStateChange: ({ data }) => {
              const isPlaying = data === 1;
              setPlaying(isPlaying);

              if (pausedCoverRef.current) {
                pausedCoverRef.current.style.opacity =
                  isPlaying ? "0" : "1";
                pausedCoverRef.current.style.visibility =
                  isPlaying ? "hidden" : "visible";
              }

              if (data === 0) {
                reportEngagement(true);
                onEndedRef.current();
              }
            },
            onError: () => {
              setPlayerError(true);
            },
          },
        });
      } catch {
        if (!cancelled) {
          setPlayerError(true);
        }
      }
    }

    createPlayer();

    return () => {
      cancelled = true;

      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      reportEngagement(false);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [reportEngagement, video.id]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (muted) {
      player.mute();
    } else {
      player.unMute();
      player.playVideo();
    }
  }, [muted]);

  function togglePlayback() {
    const player = playerRef.current;
    if (!player) return;

    if (player.getPlayerState() === 1) {
      if (pausedCoverRef.current) {
        pausedCoverRef.current.style.opacity = "1";
        pausedCoverRef.current.style.visibility = "visible";
      }

      setPlaying(false);

      window.requestAnimationFrame(() => {
        player.pauseVideo();
      });
    } else {
      player.playVideo();
    }
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;

    const nextMuted = !player.isMuted();

    if (nextMuted) {
      player.mute();
    } else {
      player.unMute();
      player.playVideo();
    }

    onMutedChange(nextMuted);
  }

  function seekTo(seconds: number) {
    const player = playerRef.current;
    if (!player) return;

    player.seekTo(seconds, true);
    setCurrentTime(seconds);
  }

  function cyclePlaybackRate() {
    const player = playerRef.current;
    if (!player || !ready) return;

    const rates =
      availablePlaybackRates.length > 0
        ? availablePlaybackRates
        : [0.5, 1, 1.25, 1.5, 2];

    const currentIndex = rates.findIndex(
      (rate) => rate === playbackRate
    );
    const nextRate =
      rates[
        currentIndex >= 0
          ? (currentIndex + 1) % rates.length
          : 0
      ];

    player.setPlaybackRate(nextRate);
    setPlaybackRate(nextRate);
  }

  return (
    <div className="reel-player">
      <img
        className={`reel-player-poster${ready ? " hidden" : ""}`}
        src={video.thumbnail}
        alt=""
      />

      <div ref={mountRef} className="reel-youtube-player" />

      <img
        ref={pausedCoverRef}
        className="reel-paused-cover"
        src={video.thumbnail}
        alt=""
        aria-hidden="true"
      />

      {!ready && !playerError && (
        <div className="reel-player-loading" aria-label="Loading Short">
          <span />
        </div>
      )}

      {playerError && (
        <div className="reel-player-error">
          <p>This Short could not play here.</p>
          <button type="button" onClick={onOpen}>
            Open full player
          </button>
        </div>
      )}

      <div className="reel-gradient" />

      <button
        type="button"
        className="reel-tap-toggle"
        onClick={togglePlayback}
        disabled={!ready || playerError}
        aria-label={
          playing
            ? "Tap to pause Short"
            : "Tap to play Short"
        }
      />

      <div className="reel-top-row">
        <button
          type="button"
          className="reel-icon-button reel-audio-button"
          onClick={toggleMute}
          disabled={!ready}
          aria-label={muted ? "Unmute Short" : "Mute Short"}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
              <path d="m16 9 5 5" />
              <path d="m21 9-5 5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
              <path d="M15 9.2a4 4 0 0 1 0 5.6" />
              <path d="M18 6.5a8 8 0 0 1 0 11" />
            </svg>
          )}
        </button>
      </div>

      <div className="reel-info reel-controls-only">
        <div className="reel-seek-row">
          <time>{formatTime(currentTime)}</time>

          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={0.25}
            value={Math.min(currentTime, Math.max(duration, 1))}
            onChange={(event) => seekTo(Number(event.target.value))}
            disabled={!ready || duration <= 0}
            aria-label="Jump to a specific time in this Short"
          />

          <time>{formatTime(duration)}</time>
        </div>

        <div className="reel-bottom-actions">
          <div className="reel-bottom-buttons">
            <button
              type="button"
              className="reel-speed-button reel-speed-inline"
              onClick={cyclePlaybackRate}
              disabled={!ready}
              aria-label={`Playback speed ${playbackRate} times. Tap to change.`}
              title="Change playback speed"
            >
              {playbackRate === 1
                ? "1x"
                : `${playbackRate}x`}
            </button>

            <button type="button" onClick={onOpen}>
              Full player
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShortsRow({ onPlay, onWatch }: Props) {
  const { addRecent } = useLibrary();
  const feedRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const watchedIdsRef = useRef<Set<string>>(new Set());
  const loadingMoreRef = useRef(false);
  const pendingNextIndexRef = useRef<number | null>(null);
  const requestVersionRef = useRef(0);
  const shortsMixRef = useRef(
    Math.floor(Math.random() * 12)
  );
  const categorySignalsRef = useRef<
    Partial<Record<ShortsCategory, CategorySignals>>
  >({});
  const observedEngagementIdsRef =
    useRef<Set<string>>(new Set());
  const preferredCategoryRef =
    useRef<ShortsCategory | null>(null);
  const excludedCategoriesRef =
    useRef<Set<ShortsCategory>>(new Set());
  const profileSignatureRef = useRef("");
  const profileLoadVersionRef = useRef(0);

  const [videos, setVideos] =
    useState<ShortVideo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [shortsMuted, setShortsMuted] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const fetchShortsPage = useCallback(
    async (
      pageToken?: string | null,
      reset = false,
      category?: ShortsCategory | null
    ): Promise<number> => {
      if (!reset && loadingMoreRef.current) {
        return 0;
      }

      const requestVersion = reset
        ? requestVersionRef.current + 1
        : requestVersionRef.current;

      if (reset) {
        requestVersionRef.current =
          requestVersion;
        loadingMoreRef.current = false;
        pendingNextIndexRef.current = null;
        categorySignalsRef.current = {};
        observedEngagementIdsRef.current.clear();
        preferredCategoryRef.current = null;
        excludedCategoriesRef.current.clear();
        profileSignatureRef.current = "";
        profileLoadVersionRef.current += 1;
        setLoading(true);
        setLoadingMore(false);
        setLoadError("");
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        const activeCategory =
          reset
            ? null
            : category ??
              preferredCategoryRef.current;

        const params = new URLSearchParams({
          mode: "shorts",
          mix: String(shortsMixRef.current),
        });

        if (activeCategory) {
          params.set(
            "category",
            activeCategory
          );
        }

        if (reset) {
          params.set(
            "refresh",
            String(Date.now())
          );
        }

        if (pageToken) {
          params.set("pageToken", pageToken);
        }

        const response = await fetch(
          `/api/youtube?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load YouTube Shorts.");
        }

        const data = await response.json();

        if (
          requestVersion !==
          requestVersionRef.current
        ) {
          return 0;
        }

        const incomingData: ShortVideo[] =
          Array.isArray(data.videos)
            ? data.videos
            : [];

        let addedCount = 0;

        setVideos((current) => {
          const existingIds = new Set(
            reset
              ? []
              : current.map((video) => video.id)
          );

          const incoming = shuffleVideos(
            incomingData
              .filter((video) => {
                const category =
                  video.shortsCategory;

                return (
                  video?.id &&
                  video?.thumbnail &&
                  video?.title &&
                  !existingIds.has(video.id) &&
                  !(
                    category &&
                    excludedCategoriesRef.current.has(
                      category
                    )
                  )
                );
              })
              .map((video) => ({
                ...video,
                section: "home",
                mediaType: "video" as const,
              }))
          );

          addedCount = incoming.length;

          return reset
            ? incoming
            : [...current, ...incoming];
        });

        setNextPageToken(
          typeof data.nextPageToken === "string"
            ? data.nextPageToken
            : null
        );

        if (reset) {
          setActiveIndex(0);
          watchedIdsRef.current.clear();
          cardRefs.current = [];
        }

        return addedCount;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load YouTube Shorts.";

        if (reset) {
          setVideos([]);
        }

        setLoadError(message);
        return 0;
      } finally {
        if (
          requestVersion ===
          requestVersionRef.current
        ) {
          if (reset) {
            setLoading(false);
          } else {
            loadingMoreRef.current = false;
            setLoadingMore(false);
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    void fetchShortsPage(null, true);
  }, [fetchShortsPage]);

  const loadMoreShorts = useCallback(async () => {
    if (
      !nextPageToken ||
      loadingMoreRef.current
    ) {
      return 0;
    }

    return fetchShortsPage(
      nextPageToken,
      false,
      preferredCategoryRef.current
    );
  }, [fetchShortsPage, nextPageToken]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = [...entries]
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio -
              first.intersectionRatio
          )[0];

        if (!mostVisible) return;

        const index = Number(
          (mostVisible.target as HTMLElement)
            .dataset.reelIndex
        );

        if (Number.isFinite(index)) {
          setActiveIndex(index);
        }
      },
      {
        root: feed,
        threshold: [0.55, 0.7, 0.85],
      }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [videos]);

  const scrollToShort = useCallback(
    (index: number) => {
      const feed = feedRef.current;
      const card = cardRefs.current[index];

      if (
        !feed ||
        !card ||
        index < 0 ||
        index >= videos.length
      ) {
        return;
      }

      feed.scrollTo({
        top: card.offsetTop,
        behavior: "smooth",
      });

      setActiveIndex(index);
    },
    [videos.length]
  );

  const goPrevious = useCallback(() => {
    scrollToShort(
      Math.max(activeIndex - 1, 0)
    );
  }, [activeIndex, scrollToShort]);

  const goNext = useCallback(async () => {
    if (activeIndex < videos.length - 1) {
      scrollToShort(activeIndex + 1);
      return;
    }

    if (nextPageToken) {
      pendingNextIndexRef.current =
        videos.length;

      if (!loadingMoreRef.current) {
        await loadMoreShorts();
      }
    }
  }, [
    activeIndex,
    loadMoreShorts,
    nextPageToken,
    scrollToShort,
    videos.length,
  ]);

  // Start loading the next YouTube results before the user reaches the end.
  useEffect(() => {
    if (
      videos.length > 0 &&
      activeIndex >= videos.length - 3 &&
      nextPageToken &&
      !loadingMoreRef.current
    ) {
      void loadMoreShorts();
    }
  }, [
    activeIndex,
    loadMoreShorts,
    nextPageToken,
    videos.length,
  ]);

  // If the user pressed Down on the final loaded Short, move to the first
  // newly appended Short after pagination completes.
  useEffect(() => {
    const pendingIndex =
      pendingNextIndexRef.current;

    if (
      pendingIndex !== null &&
      pendingIndex < videos.length
    ) {
      pendingNextIndexRef.current = null;

      window.requestAnimationFrame(() => {
        scrollToShort(pendingIndex);
      });
    }
  }, [scrollToShort, videos.length]);

  async function refreshShorts() {
    if (refreshing || loading) return;

    const feed = feedRef.current;

    feed?.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setRefreshing(true);
    categorySignalsRef.current = {};
    observedEngagementIdsRef.current.clear();
    preferredCategoryRef.current = null;
    excludedCategoriesRef.current.clear();
    profileSignatureRef.current = "";
    profileLoadVersionRef.current += 1;
    setActiveIndex(0);
    setNextPageToken(null);
    cardRefs.current = [];
    watchedIdsRef.current.clear();

    shortsMixRef.current =
      (shortsMixRef.current + 1) % 12;

    await fetchShortsPage(
      null,
      true
    );

    window.requestAnimationFrame(() => {
      feedRef.current?.scrollTo({
        top: 0,
        behavior: "auto",
      });
    });

    setRefreshing(false);
  }

  function markWatched(video: ShortVideo) {
    if (
      watchedIdsRef.current.has(video.id)
    ) {
      return;
    }

    watchedIdsRef.current.add(video.id);
    addRecent(video);
    onWatch?.(video);
  }

  function recordEngagement({
    video,
    watchedSeconds,
    duration,
    completed,
  }: ShortEngagement) {
    const category =
      video.shortsCategory;

    if (
      !category ||
      observedEngagementIdsRef.current.has(
        video.id
      )
    ) {
      return;
    }

    observedEngagementIdsRef.current.add(
      video.id
    );

    const watchRatio =
      duration > 0
        ? Math.min(
            watchedSeconds / duration,
            1
          )
        : 0;

    const strongView =
      completed ||
      watchRatio >= 0.6 ||
      watchedSeconds >=
        Math.min(20, duration * 0.5);

    const quickSkip =
      !completed &&
      watchedSeconds <= 4 &&
      watchRatio < 0.2;

    const currentSignals =
      categorySignalsRef.current[
        category
      ] || {
        views: 0,
        strongViews: 0,
        quickSkips: 0,
        totalWatchRatio: 0,
      };

    categorySignalsRef.current[
      category
    ] = {
      views:
        currentSignals.views + 1,
      strongViews:
        currentSignals.strongViews +
        (strongView ? 1 : 0),
      quickSkips:
        currentSignals.quickSkips +
        (quickSkip ? 1 : 0),
      totalWatchRatio:
        currentSignals.totalWatchRatio +
        watchRatio,
    };

    const totalObserved =
      observedEngagementIdsRef.current.size;

    if (
      totalObserved <
      MIN_SHORTS_BEFORE_PERSONALIZING
    ) {
      return;
    }

    const scoredCategories = (
      Object.entries(
        categorySignalsRef.current
      ) as Array<
        [ShortsCategory, CategorySignals]
      >
    ).map(
      ([
        signalCategory,
        signals,
      ]) => {
        const averageWatchRatio =
          signals.totalWatchRatio /
          Math.max(signals.views, 1);
        const skipRate =
          signals.quickSkips /
          Math.max(signals.views, 1);
        const score =
          signals.strongViews * 2.5 +
          averageWatchRatio * 2 -
          signals.quickSkips * 1.75;

        return {
          category: signalCategory,
          signals,
          averageWatchRatio,
          skipRate,
          score,
        };
      }
    );

    const preferred =
      scoredCategories
        .filter(
          ({
            signals,
            averageWatchRatio,
            skipRate,
            score,
          }) =>
            signals.views >= 2 &&
            signals.strongViews >= 1 &&
            averageWatchRatio >= 0.35 &&
            skipRate < 0.6 &&
            score >= 2
        )
        .sort(
          (first, second) =>
            second.score - first.score
        )[0]?.category || null;

    const excluded = new Set(
      scoredCategories
        .filter(
          ({
            signals,
            averageWatchRatio,
            skipRate,
          }) =>
            signals.views >= 2 &&
            signals.quickSkips >= 2 &&
            signals.strongViews === 0 &&
            (skipRate >= 0.67 ||
              averageWatchRatio < 0.18)
        )
        .map(({ category }) => category)
    );

    const nextSignature = [
      preferred || "mixed",
      ...Array.from(excluded).sort(),
    ].join("|");

    if (
      nextSignature ===
      profileSignatureRef.current
    ) {
      return;
    }

    profileSignatureRef.current =
      nextSignature;
    preferredCategoryRef.current =
      preferred;
    excludedCategoriesRef.current =
      excluded;
    setNextPageToken(null);

    // Keep watched Shorts. For upcoming items, remove repeated skip
    // categories and retain some mixed exploration so the profile can
    // continue learning instead of becoming permanently locked.
    setVideos((current) => {
      const currentIndex =
        current.findIndex(
          (item) =>
            item.id === video.id
        );

      if (currentIndex < 0) {
        return current;
      }

      const viewed =
        current.slice(
          0,
          currentIndex + 1
        );
      const upcoming =
        current
          .slice(currentIndex + 1)
          .filter(
            (item) =>
              !(
                item.shortsCategory &&
                excluded.has(
                  item.shortsCategory
                )
              )
          )
          .filter(
            (item, index) =>
              !preferred ||
              item.shortsCategory ===
                preferred ||
              index % 4 === 0
          );

      cardRefs.current = [];

      return [...viewed, ...upcoming];
    });

    if (!preferred) {
      return;
    }

    const profileLoadVersion =
      ++profileLoadVersionRef.current;

    void (async () => {
      while (
        loadingMoreRef.current &&
        profileLoadVersion ===
          profileLoadVersionRef.current
      ) {
        await new Promise((resolve) =>
          window.setTimeout(
            resolve,
            150
          )
        );
      }

      if (
        profileLoadVersion !==
        profileLoadVersionRef.current
      ) {
        return;
      }

      await fetchShortsPage(
        null,
        false,
        preferred
      );
    })();
  }

  function openFullPlayer(video: Video) {
    addRecent(video);
    onPlay(video);
  }

  function handleFeedKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>
  ) {
    if (
      event.key === "ArrowUp" ||
      event.key === "PageUp"
    ) {
      event.preventDefault();
      goPrevious();
    }

    if (
      event.key === "ArrowDown" ||
      event.key === "PageDown"
    ) {
      event.preventDefault();
      void goNext();
    }
  }

  if (
    !loading &&
    videos.length === 0
  ) {
    return (
      <section
        className="shorts-section"
        aria-label="YouTube Shorts feed"
      >
        <div className="shorts-toolbar">
          <button
            type="button"
            className={`reels-refresh-button shorts-refresh-icon${
              refreshing ? " refreshing" : ""
            }`}
            onClick={() => {
              void refreshShorts();
            }}
            disabled={refreshing || loading}
            aria-label="Refresh YouTube Shorts"
            title="Refresh Shorts"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6v5h-5" />
              <path d="M4 18v-5h5" />
              <path d="M18.5 9A7 7 0 0 0 6.3 6.3L4 8" />
              <path d="M5.5 15A7 7 0 0 0 17.7 17.7L20 16" />
            </svg>
          </button>
        </div>

        <div className="empty-state">
          <p>
            {loadError ||
              "YouTube Shorts are unavailable right now."}
          </p>
          <button
            type="button"
            className="reels-refresh-button"
            onClick={() =>
              void fetchShortsPage(
                null,
                true
              )
            }
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="shorts-section"
      aria-label="YouTube Shorts feed"
    >
      <div className="shorts-toolbar">
        <button
          type="button"
          className={`reels-refresh-button shorts-refresh-icon${
            refreshing ? " refreshing" : ""
          }`}
          onClick={() => {
            void refreshShorts();
          }}
          disabled={refreshing || loading}
          aria-label="Load a fresh YouTube Shorts feed"
          title="Refresh Shorts"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6v5h-5" />
            <path d="M4 18v-5h5" />
            <path d="M18.5 9A7 7 0 0 0 6.3 6.3L4 8" />
            <path d="M5.5 15A7 7 0 0 0 17.7 17.7L20 16" />
          </svg>
        </button>
      </div>

      <div className="reels-stage">
        <div
          ref={feedRef}
          className="reels-vertical-feed"
          tabIndex={0}
          onKeyDown={handleFeedKeyDown}
          aria-label="YouTube Shorts feed. Scroll up or down to watch more."
        >
          {loading
            ? Array.from(
                { length: 3 },
                (_, index) => (
                  <article
                    className="reel-slide reel-slide-loading"
                    key={index}
                  >
                    <div className="reel-loading-shimmer" />
                    <div className="reel-loading-copy" />
                    <div className="reel-loading-copy short" />
                  </article>
                )
              )
            : videos.map((video, index) => (
                <article
                  ref={(element) => {
                    cardRefs.current[index] =
                      element;
                  }}
                  data-reel-index={index}
                  className={`reel-slide${
                    activeIndex === index
                      ? " active"
                      : ""
                  }`}
                  key={`short-${video.id}`}
                  onClick={() => {
                    if (
                      activeIndex !== index
                    ) {
                      scrollToShort(index);
                    }
                  }}
                >
                  {activeIndex === index ? (
                    <ReelPlayer
                      video={video}
                      muted={shortsMuted}
                      onEnded={() => {
                        void goNext();
                      }}
                      onEngagement={
                        recordEngagement
                      }
                      onMutedChange={
                        setShortsMuted
                      }
                      onOpen={() =>
                        openFullPlayer(video)
                      }
                      onStarted={() =>
                        markWatched(video)
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      className="reel-preview"
                      onClick={() =>
                        scrollToShort(index)
                      }
                      aria-label={`Watch ${video.title}`}
                    >
                      <img
                        src={video.thumbnail}
                        alt=""
                        loading="lazy"
                      />
                      <span className="reel-preview-shade" />
                      <span
                        className="reel-preview-play"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="m9 6 9 6-9 6V6Z" />
                        </svg>
                      </span>
                      <span className="reel-preview-copy">
                        <strong>
                          {video.title}
                        </strong>
                        <small>
                          {video.channel}
                        </small>
                      </span>
                    </button>
                  )}
                </article>
              ))}
        </div>

        {!loading &&
          videos.length > 0 && (
            <aside
              className="reels-desktop-controls"
              aria-label="Shorts navigation"
            >
              <button
                type="button"
                onClick={goPrevious}
                disabled={
                  activeIndex === 0
                }
                aria-label="Previous Short"
                title="Previous Short"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m6 15 6-6 6 6" />
                </svg>
              </button>

              <span>
                {activeIndex + 1}
                {loadingMore ? " • loading" : ""}
              </span>

              <button
                type="button"
                onClick={() => {
                  void goNext();
                }}
                disabled={
                  activeIndex ===
                    videos.length - 1 &&
                  !nextPageToken &&
                  !loadingMore
                }
                aria-label="Next Short"
                title="Next Short"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </aside>
          )}
      </div>

    </section>
  );
}
