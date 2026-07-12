"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
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
const localRead = (key: string): Video[] => { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Video[]>([]);
  const [watchLater, setWatchLater] = useState<Video[]>([]);
  const [recent, setRecent] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRecent(localRead("3dhub:recent"));
    if (!user) {
      setFavorites(localRead("3dhub:favorites"));
      setWatchLater(localRead("3dhub:watchLater"));
      setLoading(false);
      return;
    }
    setLoading(true);
    let ready = 0;
    const done = () => { ready += 1; if (ready >= 2) setLoading(false); };
    const unFav = onSnapshot(collection(db, "users", user.uid, "liked"), snap => {
      setFavorites(snap.docs.map(d => ({ ...(d.data() as Video), id: (d.data().id as string) || d.id })));
      done();
    }, err => { console.error("Liked items failed:", err); done(); });
    const unLater = onSnapshot(collection(db, "users", user.uid, "watchLater"), snap => {
      setWatchLater(snap.docs.map(d => ({ ...(d.data() as Video), id: (d.data().id as string) || d.id })));
      done();
    }, err => { console.error("Watch later failed:", err); done(); });
    return () => { unFav(); unLater(); };
  }, [user]);

  useEffect(() => { if (!user) localStorage.setItem("3dhub:favorites", JSON.stringify(favorites)); }, [favorites, user]);
  useEffect(() => { if (!user) localStorage.setItem("3dhub:watchLater", JSON.stringify(watchLater)); }, [watchLater, user]);
  useEffect(() => { localStorage.setItem("3dhub:recent", JSON.stringify(recent)); }, [recent]);

  async function toggleRemote(kind: "liked" | "watchLater", list: Video[], setList: (v: Video[]) => void, video: Video) {
    const exists = list.some(item => item.id === video.id);
    if (!user) { setList(exists ? list.filter(i => i.id !== video.id) : [video, ...list]); return; }
    const ref = doc(db, "users", user.uid, kind, video.id);
    if (exists) await deleteDoc(ref);
    else await setDoc(ref, { ...video, savedAt: serverTimestamp() }, { merge: true });
  }

  const value = useMemo<LibraryContextType>(() => ({
    favorites, watchLater, recent, loading,
    toggleFavorite: (video) => toggleRemote("liked", favorites, setFavorites, video),
    toggleWatchLater: (video) => toggleRemote("watchLater", watchLater, setWatchLater, video),
    addRecent: (video) => setRecent(items => [video, ...items.filter(i => i.id !== video.id)].slice(0, 30)),
    isFavorite: id => favorites.some(i => i.id === id),
    isWatchLater: id => watchLater.some(i => i.id === id),
  }), [favorites, watchLater, recent, loading, user]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
export function useLibrary() { const v = useContext(LibraryContext); if (!v) throw new Error("useLibrary must be used inside LibraryProvider"); return v; }
