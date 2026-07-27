import {
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "@/lib/firebase";
import type { Video } from "@/components/VideoCard";

export type Section =
  | "home"
  | "movies"
  | "music"
  | "kids"
  | "3d videos"
  | "immersive audio";

/**
 * Stores a watched video in the signed-in user's history.
 *
 * YouTube metadata is assigned an expiration date of 29 days.
 * Firestore TTL must also be enabled for the `expiresAt` field
 * for automatic deletion to occur.
 */
export async function logHistory(
  user: User | null,
  video: Video,
  section: Section
): Promise<void> {
  if (!user?.uid || !video?.id) {
    return;
  }

  const historyRef = doc(
    db,
    "users",
    user.uid,
    "history",
    section,
    "items",
    video.id
  );

  const now = Date.now();
  const expiresAt = Timestamp.fromDate(
    new Date(now + 29 * 24 * 60 * 60 * 1000)
  );

  try {
    await setDoc(
      historyRef,
      {
        ...video,
        watchedAt: serverTimestamp(),
        apiDataRefreshedAt: serverTimestamp(),
        expiresAt,
      },
      {
        merge: true,
      }
    );
  } catch (error) {
    console.error("Unable to save watch history:", error);
  }
}
