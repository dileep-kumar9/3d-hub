"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Video } from "./VideoCard";
import { useAuth } from "./AuthProvider";

type LibraryContextType = {
  favorites: Video[];
  watchLater: Video[];
  recent: Video[];
  loading: boolean;
  toggleFavorite: (video: Video) => Promise<void>;
  toggleWatchLater: (video: Video) => Promise<void>;
  addRecent: (video: Video) => void;
  isFavorite: (id: string) => boolean;
  isWatchLater: (id: string) => boolean;
};

const LibraryContext = createContext<LibraryContextType | null>(null);
const API_DATA_EXPIRY_MS = 29 * 24 * 60 * 60 * 1000;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Video[]>([]);
  const [watchLater, setWatchLater] = useState<Video[]>([]);
  const [recent, setRecent] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setWatchLater([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let ready = 0;
    const done = () => {
      ready += 1;
      if (ready >= 2) setLoading(false);
    };

    const unFav = onSnapshot(
      collection(db, "users", user.uid, "liked"),
      (snapshot) => {
        setFavorites(
          snapshot.docs.map((item) => ({
            ...(item.data() as Video),
            id: (item.data().id as string) || item.id,
          }))
        );
        done();
      },
      (error) => {
        console.error("Liked items failed:", error);
        done();
      }
    );

    const unLater = onSnapshot(
      collection(db, "users", user.uid, "watchLater"),
      (snapshot) => {
        setWatchLater(
          snapshot.docs.map((item) => ({
            ...(item.data() as Video),
            id: (item.data().id as string) || item.id,
          }))
        );
        done();
      },
      (error) => {
        console.error("Watch later failed:", error);
        done();
      }
    );

    return () => {
      unFav();
      unLater();
    };
  }, [user]);

  async function toggleRemote(
    kind: "liked" | "watchLater",
    list: Video[],
    video: Video
  ) {
    if (!user) return;

    const exists = list.some((item) => item.id === video.id);
    const reference = doc(db, "users", user.uid, kind, video.id);

    if (exists) {
      await deleteDoc(reference);
      return;
    }

    const now = Date.now();
    await setDoc(
      reference,
      {
        ...video,
        savedAt: serverTimestamp(),
        apiDataRefreshedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(
          new Date(now + API_DATA_EXPIRY_MS)
        ),
      },
      { merge: true }
    );
  }

  const value = useMemo<LibraryContextType>(
    () => ({
      favorites,
      watchLater,
      recent,
      loading,
      toggleFavorite: (video) => toggleRemote("liked", favorites, video),
      toggleWatchLater: (video) => toggleRemote("watchLater", watchLater, video),
      addRecent: (video) =>
        setRecent((items) => [
          video,
          ...items.filter((item) => item.id !== video.id),
        ].slice(0, 30)),
      isFavorite: (id) => favorites.some((item) => item.id === id),
      isWatchLater: (id) => watchLater.some((item) => item.id === id),
    }),
    [favorites, watchLater, recent, loading, user]
  );

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) {
    throw new Error("useLibrary must be used inside LibraryProvider");
  }
  return value;
}
