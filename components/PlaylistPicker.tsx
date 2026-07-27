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
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import type { Video } from "./VideoCard";
import { CloseIcon, PlaylistIcon } from "./Icons";

type StoredPlaylistVideo = Video & {
  savedAt?: string;
  apiDataRefreshedAt?: string;
};

type Playlist = {
  id: string;
  name: string;
  videos: Record<string, StoredPlaylistVideo>;
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

  const readable =
    normalized
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
      setPlaylists([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "playlists"),
      (snapshot) => {
        const loadedPlaylists: Playlist[] = snapshot.docs.map((playlist) => {
          const data = playlist.data();

          return {
            id: playlist.id,
            name: data.name || "Untitled playlist",
            videos:
              (data.videos as Record<string, StoredPlaylistVideo> | undefined) ||
              {},
            section: data.section || "home",
          };
        });

        setPlaylists(loadedPlaylists);
        setLoading(false);
      },
      (snapshotError) => {
        console.error(snapshotError);
        setError("Playlists could not be loaded. Check Firestore rules.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  if (!user) {
    return null;
  }

  async function toggle(playlist: Playlist) {
    try {
      setSaving(playlist.id);
      setError("");

      const adding = !playlist.videos[video.id];
      const now = Date.now();

      const nextVideos: Record<string, StoredPlaylistVideo> = {
        ...playlist.videos,
      };

      if (adding) {
        nextVideos[video.id] = {
          ...video,
          savedAt: new Date(now).toISOString(),
          apiDataRefreshedAt: new Date(now).toISOString(),
        };
      } else {
        delete nextVideos[video.id];
      }

      const refreshTimes = Object.values(nextVideos)
        .map((item) => {
          if (!item.apiDataRefreshedAt) {
            return 0;
          }

          const parsedTime = Date.parse(item.apiDataRefreshedAt);
          return Number.isNaN(parsedTime) ? 0 : parsedTime;
        })
        .filter((time) => time > 0);

      const earliestRefresh =
        refreshTimes.length > 0 ? Math.min(...refreshTimes) : 0;

      await updateDoc(
        doc(db, "users", user.uid, "playlists", playlist.id),
        {
          [`videos.${video.id}`]: adding
            ? nextVideos[video.id]
            : deleteField(),

          expiresAt:
            Object.keys(nextVideos).length === 0
              ? deleteField()
              : Timestamp.fromDate(
                  new Date(
                    earliestRefresh > 0
                      ? earliestRefresh + 29 * 24 * 60 * 60 * 1000
                      : now + 29 * 24 * 60 * 60 * 1000
                  )
                ),
        }
      );
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

    if (!trimmed || loading) {
      return;
    }

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

      const latest = await getDocs(
        collection(db, "users", user.uid, "playlists")
      );

      const remoteDuplicate = latest.docs.some((playlist) => {
        const playlistName =
          playlist.data().name || "Untitled playlist";

        return normalizePlaylistName(playlistName) === normalized;
      });

      if (remoteDuplicate) {
        setError(
          `You already have a playlist named "${trimmed}". Choose a different name or use the existing playlist.`
        );
        return;
      }

      const now = Date.now();
      const storedVideo: StoredPlaylistVideo = {
        ...video,
        savedAt: new Date(now).toISOString(),
        apiDataRefreshedAt: new Date(now).toISOString(),
      };

      await setDoc(
        doc(
          db,
          "users",
          user.uid,
          "playlists",
          playlistDocumentId(trimmed)
        ),
        {
          name: trimmed,
          normalizedName: normalized,
          section: video.section || "home",
          videos: {
            [video.id]: storedVideo,
          },
          createdAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(
            new Date(now + 29 * 24 * 60 * 60 * 1000)
          ),
        },
        {
          merge: true,
        }
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
      <section
        className="playlist-picker"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div className="picker-title">
            <PlaylistIcon />

            <div>
              <h3>Add to Playlist</h3>
              <p>Choose exactly where this item should be saved.</p>
            </div>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close playlist picker"
          >
            <CloseIcon />
          </button>
        </header>

        {error && <div className="picker-error">{error}</div>}

        {loading ? (
          <p className="muted">Loading playlists...</p>
        ) : (
          <div className="playlist-options">
            {playlists.map((playlist) => {
              const containsVideo = Boolean(
                playlist.videos[video.id]
              );

              const itemCount = Object.keys(
                playlist.videos
              ).length;

              return (
                <button
                  type="button"
                  key={playlist.id}
                  className={containsVideo ? "selected" : ""}
                  onClick={() => toggle(playlist)}
                  disabled={saving === playlist.id}
                >
                  <span className="playlist-option-icon">
                    <PlaylistIcon size={20} />
                  </span>

                  <span>
                    <strong>{playlist.name}</strong>

                    <small>
                      {itemCount} item
                      {itemCount === 1 ? "" : "s"}
                    </small>
                  </span>

                  <span className="playlist-check">
                    {saving === playlist.id
                      ? "…"
                      : containsVideo
                        ? "✓"
                        : "+"}
                  </span>
                </button>
              );
            })}
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
              if (event.key === "Enter") {
                void create();
              }
            }}
            placeholder="Create a new playlist"
            maxLength={80}
          />

          <button
            type="button"
            onClick={() => void create()}
            disabled={
              !newName.trim() ||
              loading ||
              saving === "new"
            }
          >
            {saving === "new"
              ? "Creating..."
              : "Create"}
          </button>
        </div>
      </section>
    </div>
  );
}
