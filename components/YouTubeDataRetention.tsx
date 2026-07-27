"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  deleteField,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import {
  POLICY_CONSENT_EVENT,
  POLICY_CONSENT_KEY,
} from "./PolicyConsent";

type StoredVideo = {
  id?: string;
  title?: string;
  channel?: string;
  thumbnail?: string;
  section?: string;
  mediaType?: string;
  apiDataRefreshedAt?: Timestamp | string;
};

type RefreshedVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_AFTER_MS = 20 * DAY_MS;
const EXPIRE_AFTER_MS = 29 * DAY_MS;
const RUN_INTERVAL_MS = DAY_MS;

const HISTORY_SECTIONS = [
  "home",
  "movies",
  "music",
  "kids",
  "3d videos",
  "3d-videos",
  "immersive audio",
  "immersive-audio",
];

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function expiryFrom(baseMillis: number) {
  return Timestamp.fromDate(new Date(baseMillis + EXPIRE_AFTER_MS));
}

async function fetchCurrentVideos(ids: string[]) {
  const result = new Map<string, RefreshedVideo>();

  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    const response = await fetch(
      `/api/youtube?mode=refresh&ids=${encodeURIComponent(batch.join(","))}&refresh=1`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("YouTube metadata refresh request failed.");
    }

    const data = (await response.json()) as { videos?: RefreshedVideo[] };
    for (const video of data.videos || []) result.set(video.id, video);
  }

  return result;
}

export default function YouTubeDataRetention() {
  const { user } = useAuth();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const readConsent = () => {
      setConsented(localStorage.getItem(POLICY_CONSENT_KEY) === "accepted");
    };
    readConsent();
    window.addEventListener(POLICY_CONSENT_EVENT, readConsent);
    return () => window.removeEventListener(POLICY_CONSENT_EVENT, readConsent);
  }, []);

  useEffect(() => {
    if (!user || !consented) return;

    let cancelled = false;
    const runKey = `3dhub:youtube-retention:${user.uid}`;

    async function maintainData() {
      const lastRun = Number(localStorage.getItem(runKey) || 0);
      if (Date.now() - lastRun < RUN_INTERVAL_MS) return;

      const now = Date.now();
      const staleBefore = now - REFRESH_AFTER_MS;
      const singleRecords: Array<{
        reference: DocumentReference;
        video: StoredVideo;
        refreshedAt: number;
        expiresAt: number;
      }> = [];
      const playlistRecords: Array<{
        reference: DocumentReference;
        videos: Record<string, StoredVideo>;
        expiresAt: number;
      }> = [];

      for (const collectionName of ["liked", "watchLater"] as const) {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, collectionName)
        );
        snapshot.forEach((item) => {
          const data = item.data() as StoredVideo & {
            expiresAt?: Timestamp;
          };
          singleRecords.push({
            reference: item.ref,
            video: { ...data, id: data.id || item.id },
            refreshedAt: toMillis(data.apiDataRefreshedAt),
            expiresAt: toMillis(data.expiresAt),
          });
        });
      }

      for (const section of HISTORY_SECTIONS) {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "history", section, "items")
        );
        snapshot.forEach((item) => {
          const data = item.data() as StoredVideo & {
            expiresAt?: Timestamp;
          };
          singleRecords.push({
            reference: item.ref,
            video: { ...data, id: data.id || item.id },
            refreshedAt: toMillis(data.apiDataRefreshedAt),
            expiresAt: toMillis(data.expiresAt),
          });
        });
      }

      const playlistsSnapshot = await getDocs(
        collection(db, "users", user.uid, "playlists")
      );
      playlistsSnapshot.forEach((item) => {
        const data = item.data() as {
          videos?: Record<string, StoredVideo>;
          expiresAt?: Timestamp;
        };
        playlistRecords.push({
          reference: item.ref,
          videos: data.videos || {},
          expiresAt: toMillis(data.expiresAt),
        });
      });

      const recordsToRefresh = singleRecords.filter(
        (record) => record.refreshedAt === 0 || record.refreshedAt <= staleBefore
      );
      const playlistRefreshTime = (videos: Record<string, StoredVideo>) => {
        const times = Object.values(videos).map((video) =>
          toMillis(video.apiDataRefreshedAt)
        );
        if (times.length === 0 || times.some((time) => time === 0)) return 0;
        return Math.min(...times);
      };

      const playlistsToRefresh = playlistRecords.filter((record) => {
        const refreshedAt = playlistRefreshTime(record.videos);
        return (
          Object.keys(record.videos).length > 0 &&
          (refreshedAt === 0 || refreshedAt <= staleBefore)
        );
      });

      const ids = new Set<string>();
      for (const record of recordsToRefresh) {
        if (record.video.id) ids.add(record.video.id);
      }
      for (const playlist of playlistsToRefresh) {
        for (const id of Object.keys(playlist.videos)) ids.add(id);
      }

      const currentVideos = await fetchCurrentVideos([...ids]);
      if (cancelled) return;

      const operations: Promise<unknown>[] = [];

      for (const record of singleRecords) {
        const id = record.video.id;
        if (!id) {
          operations.push(deleteDoc(record.reference));
          continue;
        }

        if (record.refreshedAt === 0 || record.refreshedAt <= staleBefore) {
          const current = currentVideos.get(id);
          if (!current) {
            operations.push(deleteDoc(record.reference));
            continue;
          }
          operations.push(
            updateDoc(record.reference, {
              title: current.title,
              channel: current.channel,
              thumbnail: current.thumbnail,
              apiDataRefreshedAt: serverTimestamp(),
              expiresAt: Timestamp.fromDate(new Date(now + EXPIRE_AFTER_MS)),
            })
          );
        } else if (record.expiresAt === 0) {
          operations.push(
            updateDoc(record.reference, {
              expiresAt: expiryFrom(record.refreshedAt),
            })
          );
        }
      }

      for (const playlist of playlistRecords) {
        const videoIds = Object.keys(playlist.videos);
        if (videoIds.length === 0) {
          if (playlist.expiresAt !== 0) {
            operations.push(
              updateDoc(playlist.reference, {
                expiresAt: deleteField(),
                apiDataRefreshedAt: deleteField(),
              })
            );
          }
          continue;
        }

        const playlistRefreshedAt = playlistRefreshTime(playlist.videos);

        if (playlistRefreshedAt === 0 || playlistRefreshedAt <= staleBefore) {
          const refreshedVideos: Record<string, StoredVideo> = {};
          for (const id of videoIds) {
            const current = currentVideos.get(id);
            if (!current) continue;
            refreshedVideos[id] = {
              ...playlist.videos[id],
              ...current,
              apiDataRefreshedAt: new Date(now).toISOString(),
            };
          }

          operations.push(
            updateDoc(playlist.reference, {
              videos: refreshedVideos,
              apiDataRefreshedAt: serverTimestamp(),
              expiresAt:
                Object.keys(refreshedVideos).length > 0
                  ? Timestamp.fromDate(new Date(now + EXPIRE_AFTER_MS))
                  : deleteField(),
            })
          );
        } else if (playlist.expiresAt === 0) {
          operations.push(
            updateDoc(playlist.reference, {
              expiresAt: expiryFrom(playlistRefreshedAt),
            })
          );
        }
      }

      await Promise.all(operations);
      if (!cancelled) localStorage.setItem(runKey, String(Date.now()));
    }

    maintainData().catch((error) => {
      console.error("YouTube data retention maintenance failed:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [user, consented]);

  return null;
}
