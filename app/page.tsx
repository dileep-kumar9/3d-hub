"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import VideoCard, { Video } from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import ContentRow from "@/components/ContentRow";
import TrendingRow from "@/components/TrendingRow";
import { useLibrary } from "@/components/LibraryProvider";
import Hero from "@/components/Hero";
import { useAuth } from "@/components/AuthProvider";
import { logHistory } from "@/lib/history";
import { useInfiniteVideos } from "@/lib/useInfiniteVideos";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { pickDailyQuery } from "@/lib/dailyQuery";
import { RefreshIcon } from "@/components/Icons";

const defaultQueries = [
  "Telugu full movie 2026",
  "Tollywood new movie trailer",
  "Telugu blockbuster action movie",
  "Telugu movies 2026 full HD",
  "Tollywood suspense thriller movie",
];

export default function Home() {
  const { user } = useAuth();
  const { recent } = useLibrary();

  const [playing, setPlaying] = useState<Video | null>(null);
  const [activeSearchHistoryIds, setActiveSearchHistoryIds] =
    useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const { videos, loading, search, reload, loadMore, hasMore, hasSearched } = useInfiniteVideos(
    pickDailyQuery(defaultQueries)
  );

  function handlePlay(video: Video) {
    setPlaying(video);
    logHistory(user, video, "home");
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setActiveSearchHistoryIds(
        new Set()
      );
      return;
    }

    const unsubscribe = onSnapshot(
      collection(
        db,
        "users",
        user.uid,
        "searchHistory"
      ),
      (snapshot) => {
        setActiveSearchHistoryIds(
          new Set(
            snapshot.docs.map(
              (item) => item.id
            )
          )
        );
      },
      (snapshotError) => {
        console.error(
          "Search history could not be linked to Continue Exploring:",
          snapshotError
        );

        setActiveSearchHistoryIds(
          new Set()
        );
      }
    );

    return unsubscribe;
  }, [user]);

  const continueExploring =
    recent
      .filter(
        (video) =>
          Boolean(
            video.searchHistoryId &&
              activeSearchHistoryIds.has(
                video.searchHistoryId
              )
          )
      )
      .slice(0, 10);


  return (
    <div>
      {videos.length > 0 && (
        <Hero video={videos[0]}>
          <SearchBar
            section="home"
            onSearch={search}
            placeholder="Search movies, music or ask AI anything..."
          />
        </Hero>
      )}

      {!hasSearched && (
        <TrendingRow
          title="🔥 Recommended for you"
          section="home"
          onPlay={handlePlay}
        />
      )}

      {continueExploring.length > 0 && (
        <ContentRow
          title="Continue Exploring"
          videos={continueExploring}
          onPlay={handlePlay}
        />
      )}

      <div className="section-heading explore-heading" style={{ padding: "18px 24px 0" }}>
        <h2>Explore</h2>
        <span>Fresh Telugu entertainment</span>
        <button
          className={`refresh-btn${refreshing ? " spinning" : ""}`}
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh content"
          style={{ marginLeft: "auto" }}
        >
          <RefreshIcon size={20} />
        </button>
      </div>

      <div className="video-grid" style={{ padding: "0 24px 24px" }}>
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} section="home" onPlay={handlePlay} />
        ))}
      </div>

      {loading && <p style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>Loading...</p>}
      {!loading && hasMore && (
        <button className="load-more-btn" onClick={loadMore}>
          Load More
        </button>
      )}

      <VideoPlayer video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
