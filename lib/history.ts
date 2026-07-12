import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Video } from "@/components/VideoCard";
import { User } from "firebase/auth";

export type Section =
  | "home"
  | "movies"
  | "music"
  | "kids"
  | "3d videos"
  | "immersive audio";

export async function logHistory(
  user: User | null,
  video: Video,
  section: Section
) {
  if (!user) return;

  const ref = doc(
    db,
    "users",
    user.uid,
    "history",
    section,
    "items",
    video.id
  );

  try {
    await setDoc(ref, {
      ...video,
      watchedAt: serverTimestamp(),
    });
  } catch {
    // History logging is best-effort; don't block playback if it fails.
  }
}
