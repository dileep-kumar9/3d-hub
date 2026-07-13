"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query as firestoreQuery,
  Timestamp,
} from "firebase/firestore";

import { useAuth } from "./AuthProvider";
import { db } from "@/lib/firebase";
import { logSearchHistory } from "@/lib/searchHistory";

export type SearchSource = {
  historyId: string | null;
  query: string;
  section: string;
};

type Props = {
  onSearch: (
    query: string,
    source?: SearchSource
  ) => void | Promise<unknown>;
  placeholder?: string;
  section?: string;
};

type RecentSearch = {
  id: string;
  query: string;
  section: string;
  searchedAt?: Timestamp;
};

function normalizeHistoryId(
  value: string | null | undefined | void
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value
    : null;
}

function SearchIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M16.5 16.5L21 21"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicrophoneIcon({
  listening,
}: {
  listening: boolean;
}) {
  const color = listening
    ? "#ff1744"
    : "#ffffff";

  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 15.5C14.21 15.5 16 13.71 16 11.5V6C16 3.79 14.21 2 12 2C9.79 2 8 3.79 8 6V11.5C8 13.71 9.79 15.5 12 15.5Z"
        fill={color}
      />

      <path
        d="M19 11.5C19 15.37 15.87 18.5 12 18.5C8.13 18.5 5 15.37 5 11.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M12 18.5V22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M9 22H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SearchBar({
  onSearch,
  placeholder,
  section = "home",
}: Props) {
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [loading, setLoading] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  const [recentSearches, setRecentSearches] =
    useState<RecentSearch[]>([]);

  const [showHistory, setShowHistory] =
    useState(false);

  const recognitionRef = useRef<any>(null);
  const searchContainerRef =
    useRef<HTMLDivElement>(null);

  const aiKeywords = [
    "recommend",
    "suggest",
    "similar",
    "like",
    "best",
    "find me",
    "show me",
    "mood",
    "feel",
    "family",
    "romantic",
    "comedy",
    "thriller",
    "horror",
    "action",
    "science fiction",
    "sci-fi",
    "crime",
    "emotional",
    "inspiring",
  ];

  useEffect(() => {
    if (!user) {
      setRecentSearches([]);
      return;
    }

    const recentSearchQuery =
      firestoreQuery(
        collection(
          db,
          "users",
          user.uid,
          "searchHistory"
        ),
        orderBy("searchedAt", "desc"),
        limit(8)
      );

    const unsubscribe = onSnapshot(
      recentSearchQuery,
      (snapshot) => {
        const searches = snapshot.docs.map(
          (item) => {
            const data = item.data();

            return {
              id: item.id,
              query: data.query || "",
              section:
                data.section || "home",
              searchedAt:
                data.searchedAt,
            };
          }
        );

        setRecentSearches(searches);
      },
      (error) => {
        console.error(
          "Recent searches could not be loaded:",
          error
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(
          event.target as Node
        )
      ) {
        setShowHistory(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  async function runSearch(
    searchText: string,
    existingHistoryId?: string
  ) {
    const text = searchText.trim();

    if (!text) return;

    setQuery(text);
    setShowHistory(false);

    const savedHistoryId =
      existingHistoryId ??
      (await logSearchHistory(
        user,
        text,
        section
      ));

    await onSearch(text, {
      historyId:
        normalizeHistoryId(
          savedHistoryId
        ),
      query: text,
      section,
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = query.trim();

    if (!text || loading) return;

    const lowerText = text.toLowerCase();

    const useAI = aiKeywords.some(
      (keyword) =>
        lowerText.includes(keyword)
    );

    if (!useAI) {
      await runSearch(text);
      return;
    }

    setLoading(true);
    setShowHistory(false);

    try {
      const response = await fetch(
        "/api/ai-search",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            prompt: text,
            section,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "AI search failed."
        );
      }

      const data = await response.json();
      const finalQuery =
        data.query || text;

      const savedHistoryId =
        await logSearchHistory(
          user,
          text,
          section
        );

      await onSearch(finalQuery, {
        historyId:
          normalizeHistoryId(
            savedHistoryId
          ),
        query: text,
        section,
      });
    } catch (error) {
      console.error(
        "AI search error:",
        error
      );

      await runSearch(text);
    } finally {
      setLoading(false);
    }
  }

  function startVoiceSearch() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any)
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice search is not supported in this browser."
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      setShowHistory(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onresult = async (
      event: any
    ) => {
      const transcript =
        event.results[0][0].transcript;

      await runSearch(transcript);
    };

    recognition.start();
  }

  const filteredSearches =
    recentSearches.filter((item) =>
      item.query
        .toLowerCase()
        .includes(query.toLowerCase())
    );

  return (
    <div
      ref={searchContainerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        zIndex: 30,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="search-form"
        autoComplete="off"
        data-form-type="other"
      >
        <div className="search-field">
          <span className="search-symbol">
            ⌕
          </span>

          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowHistory(true);
            }}
            onFocus={() =>
              setShowHistory(true)
            }
            placeholder={
              listening
                ? "Listening..."
                : placeholder ||
                  "Search movies, music or ask AI..."
            }
            className="search-input"
            aria-label="Search"
            name="site-search"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
          />
        </div>

        <button
          type="button"
          onClick={startVoiceSearch}
          className={`search-mic ${
            listening
              ? "search-mic-listening"
              : ""
          }`}
          aria-label={
            listening
              ? "Stop voice search"
              : "Start voice search"
          }
          title={
            listening
              ? "Stop listening"
              : "Voice search"
          }
        >
          <MicrophoneIcon
            listening={listening}
          />
        </button>

        <button
          type="submit"
          disabled={loading}
          className={`search-button ${
            loading
              ? "search-button-loading"
              : ""
          }`}
          aria-label={
            loading
              ? "Searching"
              : "Search"
          }
          title={
            loading
              ? "Searching..."
              : "Search"
          }
        >
          <SearchIcon />
        </button>
      </form>

      {user &&
        showHistory &&
        filteredSearches.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              zIndex: 100,
              maxHeight: 320,
              overflowY: "auto",
              padding: 8,
              borderRadius: 15,
              border:
                "1px solid rgba(148,163,184,0.25)",
              background:
                "rgba(8,13,29,0.98)",
              boxShadow:
                "0 20px 55px rgba(0,0,0,0.55)",
              backdropFilter:
                "blur(18px)",
            }}
          >
            <p
              style={{
                margin: "6px 10px 8px",
                color: "#94a3b8",
                fontSize: 12,
                fontWeight: 800,
                textTransform:
                  "uppercase",
                letterSpacing: 1,
              }}
            >
              Recent searches
            </p>

            {filteredSearches.map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    runSearch(
                      item.query,
                      item.id
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    width: "100%",
                    minHeight: 48,
                    padding: "10px 12px",
                    border: "none",
                    borderRadius: 11,
                    color: "white",
                    background:
                      "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(
                    event
                  ) => {
                    event.currentTarget.style.background =
                      "#192544";
                  }}
                  onMouseLeave={(
                    event
                  ) => {
                    event.currentTarget.style.background =
                      "transparent";
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 0,
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        color: "#a78bfa",
                      }}
                    >
                      🕘
                    </span>

                    <span
                      style={{
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                        fontSize: 14,
                      }}
                    >
                      {item.query}
                    </span>
                  </span>

                  <span
                    style={{
                      flexShrink: 0,
                      marginLeft: 10,
                      color: "#94a3b8",
                      fontSize: 11,
                      textTransform:
                        "capitalize",
                    }}
                  >
                    {item.section}
                  </span>
                </button>
              )
            )}

            <a
              href="/settings"
              style={{
                display: "block",
                marginTop: 7,
                padding: "11px 12px",
                borderTop:
                  "1px solid rgba(148,163,184,0.16)",
                color: "#67e8f9",
                textAlign: "center",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Manage search history
            </a>
          </div>
        )}
    </div>
  );
}
