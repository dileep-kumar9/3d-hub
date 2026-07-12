"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Video } from "@/components/VideoCard";

export function useInfiniteVideos(initialQuery: string, extraParams: string = "") {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const queryRef = useRef(initialQuery);
  const pageTokenRef = useRef<string | undefined>(undefined);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const fetchPage = useCallback(
    async (
      replace: boolean,
      pageToken?: string,
      forceFresh: boolean = false
    ): Promise<boolean> => {
      if (loadingRef.current) return false;

      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({ q: queryRef.current });
        if (pageToken) params.set("pageToken", pageToken);

        if (extraParams) {
          new URLSearchParams(extraParams).forEach((value, key) => params.set(key, value));
        }

        if (forceFresh) params.set("refresh", Date.now().toString());

        const response = await fetch(`/api/youtube?${params.toString()}`, {
          cache: forceFresh ? "no-store" : "default",
        });

        if (!response.ok) {
          throw new Error(`YouTube request failed with status ${response.status}`);
        }

        const data = await response.json();
        const incoming: Video[] = data.videos || [];

        setVideos((current) => {
          if (replace) return incoming;

          const seen = new Set(current.map((video) => video.id));
          return [...current, ...incoming.filter((video) => !seen.has(video.id))];
        });

        pageTokenRef.current = data.nextPageToken || undefined;
        hasMoreRef.current = Boolean(data.nextPageToken);
        setHasMore(Boolean(data.nextPageToken));
        return true;
      } catch (error) {
        console.error("Videos could not be loaded:", error);
        return false;
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [extraParams]
  );

  function search(newQuery: string) {
    queryRef.current = newQuery;
    pageTokenRef.current = undefined;
    hasMoreRef.current = true;
    setHasMore(true);
    void fetchPage(true, undefined, false);
  }

  // Replace the current videos with the next page of results. This makes the
  // refresh button visibly change content instead of requesting the same cached page.
  async function reload() {
    const nextPage = pageTokenRef.current;
    const succeeded = await fetchPage(true, nextPage, true);

    // When the last page has been reached, the following refresh starts again
    // from page one using a cache-bypassing request.
    if (succeeded && !nextPage && !pageTokenRef.current) {
      hasMoreRef.current = false;
      setHasMore(false);
    }

    return succeeded;
  }

  function loadMore() {
    if (hasMoreRef.current && !loadingRef.current && pageTokenRef.current) {
      void fetchPage(false, pageTokenRef.current, false);
    }
  }

  useEffect(() => {
    void fetchPage(true, undefined, false);
    // The initial query is deliberately captured once for this page instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videos, loading, search, reload, loadMore, hasMore };
}
