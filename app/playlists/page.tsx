"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { PlaylistIcon } from "@/components/Icons";

type Playlist = {
  id: string;
  name: string;
  count: number;
};

export default function PlaylistsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      setFetching(false);
      return;
    }

    return onSnapshot(
      collection(db, "users", user.uid, "playlists"),
      (snapshot) => {
        const nextItems = snapshot.docs
          .map((playlist) => ({
            id: playlist.id,
            name: playlist.data().name || "Untitled playlist",
            count: Object.keys(playlist.data().videos || {}).length,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setItems(nextItems);
        setSelected((current) => {
          const existingIds = new Set(nextItems.map((item) => item.id));
          return new Set([...current].filter((id) => existingIds.has(id)));
        });
        setFetching(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Playlists could not be loaded.");
        setFetching(false);
      }
    );
  }, [user]);

  const allSelected = useMemo(
    () => items.length > 0 && selected.size === items.length,
    [items.length, selected.size]
  );

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  async function deleteSelected() {
    if (!user || selected.size === 0) return;

    const selectedNames = items
      .filter((item) => selected.has(item.id))
      .map((item) => item.name);
    const description =
      selectedNames.length === 1
        ? `Delete the playlist "${selectedNames[0]}"?`
        : `Delete ${selectedNames.length} selected playlists?`;

    if (!window.confirm(`${description} This cannot be undone.`)) return;

    try {
      setDeleting(true);
      setError("");
      await Promise.all(
        [...selected].map((id) => deleteDoc(doc(db, "users", user.uid, "playlists", id)))
      );
      setSelected(new Set());
    } catch (deleteError) {
      console.error(deleteError);
      setError("Some selected playlists could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p className="page-message">Checking your account...</p>;

  return (
    <main className="collection-page">
      <div className="collection-heading">
        <PlaylistIcon size={48} />
        <div>
          <h1>Your Playlists</h1>
          <p>Named collections for movies, music, kids, 3D and immersive audio.</p>
        </div>
      </div>

      {!fetching && items.length > 0 && (
        <div className="playlist-selection-toolbar">
          <label className="playlist-select-all">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span>{allSelected ? "Clear selection" : "Select all"}</span>
          </label>

          <span className="playlist-selected-count">
            {selected.size} selected
          </span>

          <button
            type="button"
            className="delete-selected-playlists"
            onClick={deleteSelected}
            disabled={selected.size === 0 || deleting}
          >
            {deleting ? "Deleting..." : `Delete selected${selected.size ? ` (${selected.size})` : ""}`}
          </button>
        </div>
      )}

      {fetching ? (
        <p className="page-message">Loading playlists...</p>
      ) : error ? (
        <div className="error-panel">{error}</div>
      ) : items.length ? (
        <div className="playlist-grid">
          {items.map((playlist) => {
            const isSelected = selected.has(playlist.id);
            return (
              <article
                key={playlist.id}
                className={`playlist-card playlist-card-selectable${isSelected ? " selected" : ""}`}
              >
                <label className="playlist-card-checkbox" title={`Select ${playlist.name}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(playlist.id)}
                    aria-label={`Select ${playlist.name}`}
                  />
                </label>

                <Link href={`/playlists/${playlist.id}`} className="playlist-card-link">
                  <span className="playlist-card-icon">
                    <PlaylistIcon size={30} />
                  </span>
                  <strong>{playlist.name}</strong>
                  <small>
                    {playlist.count} item{playlist.count === 1 ? "" : "s"}
                  </small>
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No playlists yet</h2>
          <p>Tap Add to Playlist on any content card and create one.</p>
        </div>
      )}
    </main>
  );
}
