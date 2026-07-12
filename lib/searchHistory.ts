import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { User } from "firebase/auth";
import { db } from "@/lib/firebase";

export async function logSearchHistory(
  user: User | null,
  searchQuery: string,
  section: string
): Promise<string | null> {
  const cleanedQuery = searchQuery.trim();

  if (!user || !cleanedQuery) {
    return null;
  }

  try {
    const searchDocument = await addDoc(
      collection(
        db,
        "users",
        user.uid,
        "searchHistory"
      ),
      {
        query: cleanedQuery,
        section,
        searchedAt: serverTimestamp(),
      }
    );

    return searchDocument.id;
  } catch (error) {
    console.error(
      "Could not save search history:",
      error
    );

    return null;
  }
}
