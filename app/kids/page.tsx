"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import VideoCard, { Video } from "@/components/VideoCard";
import TrendingRow from "@/components/TrendingRow";
import ShortsRow from "@/components/ShortsRow";
import VideoPlayer from "@/components/VideoPlayer";
import { useAuth } from "@/components/AuthProvider";
import { logHistory } from "@/lib/history";
import { useInfiniteVideos } from "@/lib/useInfiniteVideos";
import { pickDailyQuery } from "@/lib/dailyQuery";
import { RefreshIcon } from "@/components/Icons";

const defaultQueries = [
  "Telugu nursery rhymes",
  "Telugu kids songs",
  "Kids cartoons Telugu",
  "Animated stories for children",
  "Educational videos for kids",
];

type KidsView = "videos" | "shorts";

export default function Kids() {
  const { user } = useAuth();
  const [playing, setPlaying] = useState<Video | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<KidsView>("videos");

  const {
    videos,
    loading,
    search,
    reload,
    loadMore,
    hasMore,
    hasSearched,
  } = useInfiniteVideos(pickDailyQuery(defaultQueries));

  const handlePlay = (video: Video) => {
    setPlaying(video);
    logHistory(user, video, "kids");
  };

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className={`page-wrap kids-page kids-${view}-view`}>
      <div className="page-header kids-page-header">
        <div>
          <span className="eyebrow">Family-friendly</span>
          <h1>{view === "shorts" ? "Kids Shorts" : "Kids"}</h1>
          <p>
            {view === "shorts"
              ? "A vertical feed containing only child-friendly Kids Shorts."
              : "Cartoons, nursery rhymes, learning and fun Telugu videos for children."}
          </p>
        </div>

        <div className="kids-view-switch" role="tablist" aria-label="Kids content type">
          <button
            type="button"
            role="tab"
            aria-selected={view === "videos"}
            className={view === "videos" ? "active" : ""}
            onClick={() => setView("videos")}
          >
            Kids Videos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "shorts"}
            className={view === "shorts" ? "active" : ""}
            onClick={() => setView("shorts")}
          >
            Kids Shorts
          </button>
        </div>
      </div>

      {view === "shorts" ? (
        <section className="kids-shorts-section" aria-label="Kids Shorts">
          <ShortsRow
            forcedCategory="kids"
            onPlay={handlePlay}
            onWatch={(video) => logHistory(user, video, "kids")}
          />
        </section>
      ) : (
        <>
          <div className="content-search-row">
            <div className="content-search-box">
              <SearchBar
                section="kids"
                onSearch={search}
                placeholder="Search kids videos or ask AI..."
              />
            </div>
            <button
              className={`refresh-btn${refreshing ? " spinning" : ""}`}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh content"
              aria-label="Refresh content"
            >
              <RefreshIcon size={20} />
              <span className="refresh-label">Refresh</span>
            </button>
          </div>

          {!hasSearched && (
            <TrendingRow
              title="🔥 Trending Kids"
              section="kids"
              onPlay={handlePlay}
            />
          )}

          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                section="kids"
                onPlay={handlePlay}
              />
            ))}
          </div>

          {loading && (
            <p style={{ textAlign: "center", color: "#94a3b8" }}>
              Loading...
            </p>
          )}

          {!loading && hasMore && (
            <button className="load-more-btn" onClick={loadMore}>
              Load More
            </button>
          )}
        </>
      )}

      <VideoPlayer video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
