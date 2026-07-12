"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { Video } from "./VideoCard";
import { CloseIcon, PlaylistIcon } from "./Icons";

type Playlist = {
  id: string;
  name: string;
  videos: Record<string, Video>;
  section?: string;
};

function normalizePlaylistName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function playlistDocumentId(name: string) {
  const normalized = normalizePlaylistName(name);
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const readable = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "playlist";

  return `${readable}-${(hash >>> 0).toString(36)}`;
}

export default function PlaylistPicker({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    return onSnapshot(
      collection(db, "users", user.uid, "playlists"),
      (snapshot) => {
        setPlaylists(
          snapshot.docs.map((playlist) => ({
            id: playlist.id,
            name: playlist.data().name || "Untitled playlist",
            videos: playlist.data().videos || {},
            section: playlist.data().section || "home",
          }))
        );
        setLoading(false);
      },
      (snapshotError) => {
        setError("Playlists could not be loaded. Check Firestore rules.");
        setLoading(false);
        console.error(snapshotError);
      }
    );
  }, [user]);

  if (!user) return null;

  async function toggle(playlist: Playlist) {
    try {
      setSaving(playlist.id);
      setError("");
      await updateDoc(doc(db, "users", user.uid, "playlists", playlist.id), {
        [`videos.${video.id}`]: playlist.videos[video.id]
          ? deleteField()
          : { ...video, savedAt: new Date().toISOString() },
      });
    } catch (toggleError) {
      console.error(toggleError);
      setError("Could not update that playlist.");
    } finally {
      setSaving(null);
    }
  }

  async function create() {
    const trimmed = newName.trim().replace(/\s+/g, " ");
    const normalized = normalizePlaylistName(trimmed);
    if (!trimmed || loading) return;

    const localDuplicate = playlists.some(
      (playlist) => normalizePlaylistName(playlist.name) === normalized
    );

    if (localDuplicate) {
      setError(
        `You already have a playlist named "${trimmed}". Choose a different name or use the existing playlist.`
      );
      return;
    }

    try {
      setSaving("new");
      setError("");

      // Recheck Firestore immediately before writing so stale browser state cannot
      // create a duplicate. The deterministic document ID also protects against
      // two devices creating the same name at the same time.
      const latest = await getDocs(collection(db, "users", user.uid, "playlists"));
      const remoteDuplicate = latest.docs.some(
        (playlist) =>
          normalizePlaylistName(playlist.data().name || "Untitled playlist") === normalized
      );

      if (remoteDuplicate) {
        setError(
          `You already have a playlist named "${trimmed}". Choose a different name or use the existing playlist.`
        );
        return;
      }

      await setDoc(
        doc(db, "users", user.uid, "playlists", playlistDocumentId(trimmed)),
        {
          name: trimmed,
          normalizedName: normalized,
          section: video.section || "home",
          videos: { [video.id]: video },
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      setNewName("");
    } catch (createError) {
      console.error(createError);
      setError("Could not create playlist.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="picker-backdrop" onClick={onClose}>
      <section className="playlist-picker" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="picker-title">
            <PlaylistIcon />
            <div>
              <h3>Add to Playlist</h3>
              <p>Choose exactly where this item should be saved.</p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close playlist picker">
            <CloseIcon />
          </button>
        </header>

        {error && <div className="picker-error">{error}</div>}

        {loading ? (
          <p className="muted">Loading playlists...</p>
        ) : (
          <div className="playlist-options">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                className={playlist.videos[video.id] ? "selected" : ""}
                onClick={() => toggle(playlist)}
                disabled={saving === playlist.id}
              >
                <span className="playlist-option-icon">
                  <PlaylistIcon size={20} />
                </span>
                <span>
                  <strong>{playlist.name}</strong>
                  <small>
                    {Object.keys(playlist.videos).length} item
                    {Object.keys(playlist.videos).length === 1 ? "" : "s"}
                  </small>
                </span>
                <span className="playlist-check">
                  {saving === playlist.id ? "…" : playlist.videos[video.id] ? "✓" : "+"}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="create-playlist">
          <input
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") create();
            }}
            placeholder="Create a new playlist"
            maxLength={80}
          />
          <button
            onClick={create}
            disabled={!newName.trim() || loading || saving === "new"}
          >
            {saving === "new" ? "Creating..." : "Create"}
          </button>
        </div>
      </section>
    </div>
  );
}
