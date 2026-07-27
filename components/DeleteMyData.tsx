"use client";

import { useState } from "react";
import {
  collection,
  getDocs,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

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

async function deleteReferences(references: DocumentReference[]) {
  for (let index = 0; index < references.length; index += 400) {
    const batch = writeBatch(db);
    for (const reference of references.slice(index, index + 400)) {
      batch.delete(reference);
    }
    await batch.commit();
  }
}

export default function DeleteMyData() {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!user) return null;

  async function deleteAllData() {
    const confirmed = window.confirm(
      "Delete all data saved by 3D Hub? This removes search history, watch history, liked items, watch-later items, playlists, and related browser data. It does not delete anything from YouTube."
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessage("");
    setError("");

    try {
      const references: DocumentReference[] = [];

      for (const collectionName of [
        "searchHistory",
        "liked",
        "watchLater",
        "playlists",
      ]) {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, collectionName)
        );
        snapshot.forEach((item) => references.push(item.ref));
      }

      for (const section of HISTORY_SECTIONS) {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "history", section, "items")
        );
        snapshot.forEach((item) => references.push(item.ref));
      }

      await deleteReferences(references);

      for (const key of Object.keys(localStorage)) {
        if (
          key.startsWith("3dhub:") ||
          key.startsWith("3d-hub-news-")
        ) {
          localStorage.removeItem(key);
        }
      }

      setMessage(
        "All data stored by 3D Hub for this account was deleted. Your YouTube account and YouTube data were not changed."
      );

      window.setTimeout(() => window.location.reload(), 1200);
    } catch (deleteError) {
      console.error("Could not delete all 3D Hub data:", deleteError);
      setError(
        "Some data could not be deleted. Check your Firestore rules and try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section
      style={{
        marginBottom: 24,
        padding: 20,
        borderRadius: 16,
        border: "1px solid rgba(239,68,68,0.4)",
        background: "rgba(127,29,29,0.2)",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Delete my data</h2>
      <p style={{ color: "var(--muted)", lineHeight: 1.65 }}>
        Permanently remove your search history, watch history, liked items,
        watch-later items, playlists, and related browser data from 3D Hub.
        This does not delete or modify anything stored by YouTube.
      </p>

      {message && (
        <p role="status" style={{ color: "var(--success)" }}>
          {message}
        </p>
      )}
      {error && (
        <p role="alert" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={deleteAllData}
        disabled={deleting}
        style={{
          border: 0,
          borderRadius: 10,
          padding: "11px 16px",
          cursor: "pointer",
          background: "var(--danger)",
          color: "white",
          fontWeight: 700,
        }}
      >
        {deleting ? "Deleting..." : "Delete all my 3D Hub data"}
      </button>
    </section>
  );
}
