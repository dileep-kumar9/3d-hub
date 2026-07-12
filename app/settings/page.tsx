"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

type SearchHistoryItem = {
  id: string;
  query: string;
  section: string;
  searchedAt?: Timestamp;
};

type WatchHistoryItem = {
  key: string;
  documentId: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  section: string;
  sectionLabel: string;
  watchedAt?: Timestamp;
};

const HISTORY_SECTIONS = [
  {
    key: "home",
    label: "Home",
  },
  {
    key: "movies",
    label: "Movies",
  },
  {
    key: "music",
    label: "Music",
  },
  {
    key: "kids",
    label: "Kids",
  },
  {
    key: "3d videos",
    label: "3D Videos",
  },
  {
    key: "3d-videos",
    label: "3D Videos",
  },
  {
    key: "immersive audio",
    label: "Immersive Audio",
  },
  {
    key: "immersive-audio",
    label: "Immersive Audio",
  },
];

function timestampValue(
  timestamp?: Timestamp
) {
  return timestamp?.toMillis?.() || 0;
}

function formatDate(
  timestamp?: Timestamp
) {
  if (!timestamp) {
    return "Recently";
  }

  return timestamp
    .toDate()
    .toLocaleString();
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [searchHistoryOpen, setSearchHistoryOpen] =
    useState(false);

  const [watchHistoryOpen, setWatchHistoryOpen] =
    useState(false);

  const [searches, setSearches] =
    useState<SearchHistoryItem[]>([]);

  const [watchHistory, setWatchHistory] =
    useState<WatchHistoryItem[]>([]);

  const [
    selectedSearchIds,
    setSelectedSearchIds,
  ] = useState<Set<string>>(
    new Set()
  );

  const [
    selectedWatchKeys,
    setSelectedWatchKeys,
  ] = useState<Set<string>>(
    new Set()
  );

  const [
    loadingSearches,
    setLoadingSearches,
  ] = useState(true);

  const [
    loadingWatchHistory,
    setLoadingWatchHistory,
  ] = useState(true);

  const [deletingSearches, setDeletingSearches] =
    useState(false);

  const [deletingWatchHistory, setDeletingWatchHistory] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  /*
    Load search history.
  */
  useEffect(() => {
    if (!user) {
      setSearches([]);
      setLoadingSearches(false);
      return;
    }

    setLoadingSearches(true);

    const searchHistoryReference =
      collection(
        db,
        "users",
        user.uid,
        "searchHistory"
      );

    const unsubscribe = onSnapshot(
      searchHistoryReference,
      (snapshot) => {
        const loadedSearches =
          snapshot.docs.map((item) => {
            const data = item.data();

            return {
              id: item.id,
              query:
                typeof data.query === "string"
                  ? data.query
                  : "Unknown search",
              section:
                typeof data.section === "string"
                  ? data.section
                  : "home",
              searchedAt:
                data.searchedAt,
            };
          });

        loadedSearches.sort(
          (first, second) =>
            timestampValue(
              second.searchedAt
            ) -
            timestampValue(
              first.searchedAt
            )
        );

        setSearches(loadedSearches);
        setLoadingSearches(false);
      },
      (snapshotError) => {
        console.error(
          "Search-history loading failed:",
          snapshotError
        );

        setError(
          "Search history could not be loaded."
        );

        setLoadingSearches(false);
      }
    );

    return unsubscribe;
  }, [user]);

  /*
    Load watch history from all sections.
  */
  useEffect(() => {
    if (!user) {
      setWatchHistory([]);
      setLoadingWatchHistory(false);
      return;
    }

    setLoadingWatchHistory(true);

    const sectionResults =
      new Map<
        string,
        WatchHistoryItem[]
      >();

    const loadedSections =
      new Set<string>();

    const unsubscribers =
      HISTORY_SECTIONS.map((section) => {
        const historyReference =
          collection(
            db,
            "users",
            user.uid,
            "history",
            section.key,
            "items"
          );

        return onSnapshot(
          historyReference,
          (snapshot) => {
            const items =
              snapshot.docs.map(
                (item) => {
                  const data =
                    item.data();

                  return {
                    key: `${section.key}:${item.id}`,
                    documentId:
                      item.id,
                    videoId:
                      typeof data.id ===
                      "string"
                        ? data.id
                        : item.id,
                    title:
                      typeof data.title ===
                      "string"
                        ? data.title
                        : "Untitled video",
                    channel:
                      typeof data.channel ===
                      "string"
                        ? data.channel
                        : "",
                    thumbnail:
                      typeof data.thumbnail ===
                      "string"
                        ? data.thumbnail
                        : "",
                    section:
                      section.key,
                    sectionLabel:
                      section.label,
                    watchedAt:
                      data.watchedAt,
                  };
                }
              );

            sectionResults.set(
              section.key,
              items
            );

            loadedSections.add(
              section.key
            );

            const combinedItems =
              Array.from(
                sectionResults.values()
              ).flat();

            combinedItems.sort(
              (first, second) =>
                timestampValue(
                  second.watchedAt
                ) -
                timestampValue(
                  first.watchedAt
                )
            );

            setWatchHistory(
              combinedItems
            );

            if (
              loadedSections.size ===
              HISTORY_SECTIONS.length
            ) {
              setLoadingWatchHistory(
                false
              );
            }
          },
          (snapshotError) => {
            console.error(
              `History loading failed for ${section.key}:`,
              snapshotError
            );

            loadedSections.add(
              section.key
            );

            if (
              loadedSections.size ===
              HISTORY_SECTIONS.length
            ) {
              setLoadingWatchHistory(
                false
              );
            }
          }
        );
      });

    return () => {
      unsubscribers.forEach(
        (unsubscribe) =>
          unsubscribe()
      );
    };
  }, [user]);

  const allSearchesSelected =
    useMemo(
      () =>
        searches.length > 0 &&
        searches.every((item) =>
          selectedSearchIds.has(
            item.id
          )
        ),
      [searches, selectedSearchIds]
    );

  const allWatchItemsSelected =
    useMemo(
      () =>
        watchHistory.length > 0 &&
        watchHistory.every((item) =>
          selectedWatchKeys.has(
            item.key
          )
        ),
      [
        watchHistory,
        selectedWatchKeys,
      ]
    );

  function toggleSearchSelection(
    id: string
  ) {
    setSelectedSearchIds(
      (current) => {
        const updated =
          new Set(current);

        if (updated.has(id)) {
          updated.delete(id);
        } else {
          updated.add(id);
        }

        return updated;
      }
    );
  }

  function toggleWatchSelection(
    key: string
  ) {
    setSelectedWatchKeys(
      (current) => {
        const updated =
          new Set(current);

        if (updated.has(key)) {
          updated.delete(key);
        } else {
          updated.add(key);
        }

        return updated;
      }
    );
  }

  function toggleAllSearches() {
    if (allSearchesSelected) {
      setSelectedSearchIds(
        new Set()
      );
      return;
    }

    setSelectedSearchIds(
      new Set(
        searches.map(
          (item) => item.id
        )
      )
    );
  }

  function toggleAllWatchHistory() {
    if (allWatchItemsSelected) {
      setSelectedWatchKeys(
        new Set()
      );
      return;
    }

    setSelectedWatchKeys(
      new Set(
        watchHistory.map(
          (item) => item.key
        )
      )
    );
  }

  async function deleteSelectedSearches() {
    if (
      !user ||
      selectedSearchIds.size === 0 ||
      deletingSearches
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${selectedSearchIds.size} selected search item(s)?`
      );

    if (!confirmed) return;

    setDeletingSearches(true);
    setMessage("");
    setError("");

    try {
      await Promise.all(
        Array.from(
          selectedSearchIds
        ).map((id) =>
          deleteDoc(
            doc(
              db,
              "users",
              user.uid,
              "searchHistory",
              id
            )
          )
        )
      );

      setSelectedSearchIds(
        new Set()
      );

      setMessage(
        "Selected search-history items were deleted."
      );
    } catch (deleteError) {
      console.error(
        deleteError
      );

      setError(
        "Selected search-history items could not be deleted."
      );
    } finally {
      setDeletingSearches(false);
    }
  }

  async function deleteAllSearches() {
    if (
      !user ||
      searches.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete all search history?"
      );

    if (!confirmed) return;

    setSelectedSearchIds(
      new Set(
        searches.map(
          (item) => item.id
        )
      )
    );

    setDeletingSearches(true);
    setMessage("");
    setError("");

    try {
      await Promise.all(
        searches.map((item) =>
          deleteDoc(
            doc(
              db,
              "users",
              user.uid,
              "searchHistory",
              item.id
            )
          )
        )
      );

      setSelectedSearchIds(
        new Set()
      );

      setMessage(
        "All search history was deleted."
      );
    } catch (deleteError) {
      console.error(
        deleteError
      );

      setError(
        "Search history could not be cleared."
      );
    } finally {
      setDeletingSearches(false);
    }
  }

  async function deleteSelectedWatchHistory() {
    if (
      !user ||
      selectedWatchKeys.size === 0 ||
      deletingWatchHistory
    ) {
      return;
    }

    const selectedItems =
      watchHistory.filter(
        (item) =>
          selectedWatchKeys.has(
            item.key
          )
      );

    const confirmed =
      window.confirm(
        `Delete ${selectedItems.length} selected watch-history item(s)?`
      );

    if (!confirmed) return;

    setDeletingWatchHistory(true);
    setMessage("");
    setError("");

    try {
      await Promise.all(
        selectedItems.map(
          (item) =>
            deleteDoc(
              doc(
                db,
                "users",
                user.uid,
                "history",
                item.section,
                "items",
                item.documentId
              )
            )
        )
      );

      setSelectedWatchKeys(
        new Set()
      );

      setMessage(
        "Selected watch-history items were deleted."
      );
    } catch (deleteError) {
      console.error(
        deleteError
      );

      setError(
        "Selected watch-history items could not be deleted."
      );
    } finally {
      setDeletingWatchHistory(
        false
      );
    }
  }

  async function deleteAllWatchHistory() {
    if (
      !user ||
      watchHistory.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete all watch history?"
      );

    if (!confirmed) return;

    setDeletingWatchHistory(true);
    setMessage("");
    setError("");

    try {
      await Promise.all(
        watchHistory.map(
          (item) =>
            deleteDoc(
              doc(
                db,
                "users",
                user.uid,
                "history",
                item.section,
                "items",
                item.documentId
              )
            )
        )
      );

      setSelectedWatchKeys(
        new Set()
      );

      setMessage(
        "All watch history was deleted."
      );
    } catch (deleteError) {
      console.error(
        deleteError
      );

      setError(
        "Watch history could not be cleared."
      );
    } finally {
      setDeletingWatchHistory(
        false
      );
    }
  }

  if (loading) {
    return (
      <p style={{ padding: 24 }}>
        Loading settings...
      </p>
    );
  }

  if (!user) {
    return (
      <p style={{ padding: 24 }}>
        Redirecting to login...
      </p>
    );
  }

  return (
    <main
      style={{
        width: "100%",
        maxWidth: 980,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 32,
        }}
      >
        Settings
      </h1>

      <p
        style={{
          margin: "8px 0 26px",
          color: "#94a3b8",
        }}
      >
        Open a history section only when
        you want to review or remove items.
      </p>

      {message && (
        <div style={successBoxStyle}>
          {message}
        </div>
      )}

      {error && (
        <div style={errorBoxStyle}>
          {error}
        </div>
      )}

      {/* Search history */}

      <section style={sectionStyle}>
        <div
          style={{
            ...sectionHeaderStyle,
            marginBottom: searchHistoryOpen ? 18 : 0,
          }}
        >
          <div>
            <h2 style={sectionTitleStyle}>
              Search history
            </h2>

            <p style={sectionDescriptionStyle}>
              Review or delete previous searches.
              Your history stays hidden until opened.
            </p>
          </div>

          <div style={sectionHeaderActionsStyle}>
            {searchHistoryOpen && (
              <span style={countBadgeStyle}>
                {searches.length}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchHistoryOpen((current) => !current);
                setMessage("");
                setError("");
              }}
              style={manageButtonStyle}
              aria-expanded={searchHistoryOpen}
            >
              {searchHistoryOpen ? "Hide" : "Manage"}
              <span
                aria-hidden="true"
                style={{
                  ...chevronStyle,
                  transform: searchHistoryOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                ▾
              </span>
            </button>
          </div>
        </div>

        {searchHistoryOpen && (loadingSearches ? (
          <p>Loading searches...</p>
        ) : searches.length === 0 ? (
          <p style={emptyTextStyle}>
            No search history yet.
          </p>
        ) : (
          <>
            <div style={actionRowStyle}>
              <label style={selectAllStyle}>
                <input
                  type="checkbox"
                  checked={
                    allSearchesSelected
                  }
                  onChange={
                    toggleAllSearches
                  }
                />

                Select all
              </label>

              <div style={buttonGroupStyle}>
                <button
                  type="button"
                  onClick={
                    deleteSelectedSearches
                  }
                  disabled={
                    deletingSearches ||
                    selectedSearchIds.size ===
                      0
                  }
                  style={
                    secondaryDangerButtonStyle
                  }
                >
                  {deletingSearches
                    ? "Deleting..."
                    : `Delete selected (${selectedSearchIds.size})`}
                </button>

                <button
                  type="button"
                  onClick={
                    deleteAllSearches
                  }
                  disabled={
                    deletingSearches
                  }
                  style={dangerButtonStyle}
                >
                  Clear all
                </button>
              </div>
            </div>

            <div style={historyListStyle}>
              {searches.map((item) => (
                <label
                  key={item.id}
                  style={{
                    ...historyItemStyle,
                    background:
                      selectedSearchIds.has(
                        item.id
                      )
                        ? "rgba(124,58,237,0.18)"
                        : "rgba(15,23,42,0.45)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSearchIds.has(
                      item.id
                    )}
                    onChange={() =>
                      toggleSearchSelection(
                        item.id
                      )
                    }
                    style={checkboxStyle}
                  />

                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <p style={itemTitleStyle}>
                      {item.query}
                    </p>

                    <p style={itemMetaStyle}>
                      {item.section} •{" "}
                      {formatDate(
                        item.searchedAt
                      )}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </>
        ))}
      </section>

      {/* Watch history */}

      <section style={sectionStyle}>
        <div
          style={{
            ...sectionHeaderStyle,
            marginBottom: watchHistoryOpen ? 18 : 0,
          }}
        >
          <div>
            <h2 style={sectionTitleStyle}>
              Watch history
            </h2>

            <p style={sectionDescriptionStyle}>
              Review or delete watched videos.
              Your history stays hidden until opened.
            </p>
          </div>

          <div style={sectionHeaderActionsStyle}>
            {watchHistoryOpen && (
              <span style={countBadgeStyle}>
                {watchHistory.length}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setWatchHistoryOpen((current) => !current);
                setMessage("");
                setError("");
              }}
              style={manageButtonStyle}
              aria-expanded={watchHistoryOpen}
            >
              {watchHistoryOpen ? "Hide" : "Manage"}
              <span
                aria-hidden="true"
                style={{
                  ...chevronStyle,
                  transform: watchHistoryOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                ▾
              </span>
            </button>
          </div>
        </div>

        {watchHistoryOpen && (loadingWatchHistory ? (
          <p>
            Loading watch history...
          </p>
        ) : watchHistory.length === 0 ? (
          <p style={emptyTextStyle}>
            No watch history yet.
          </p>
        ) : (
          <>
            <div style={actionRowStyle}>
              <label style={selectAllStyle}>
                <input
                  type="checkbox"
                  checked={
                    allWatchItemsSelected
                  }
                  onChange={
                    toggleAllWatchHistory
                  }
                />

                Select all
              </label>

              <div style={buttonGroupStyle}>
                <button
                  type="button"
                  onClick={
                    deleteSelectedWatchHistory
                  }
                  disabled={
                    deletingWatchHistory ||
                    selectedWatchKeys.size ===
                      0
                  }
                  style={
                    secondaryDangerButtonStyle
                  }
                >
                  {deletingWatchHistory
                    ? "Deleting..."
                    : `Delete selected (${selectedWatchKeys.size})`}
                </button>

                <button
                  type="button"
                  onClick={
                    deleteAllWatchHistory
                  }
                  disabled={
                    deletingWatchHistory
                  }
                  style={dangerButtonStyle}
                >
                  Clear all
                </button>
              </div>
            </div>

            <div style={historyListStyle}>
              {watchHistory.map(
                (item) => (
                  <label
                    key={item.key}
                    style={{
                      ...historyItemStyle,
                      background:
                        selectedWatchKeys.has(
                          item.key
                        )
                          ? "rgba(124,58,237,0.18)"
                          : "rgba(15,23,42,0.45)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedWatchKeys.has(
                        item.key
                      )}
                      onChange={() =>
                        toggleWatchSelection(
                          item.key
                        )
                      }
                      style={checkboxStyle}
                    />

                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt=""
                        style={thumbnailStyle}
                      />
                    )}

                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <p style={itemTitleStyle}>
                        {item.title}
                      </p>

                      {item.channel && (
                        <p style={channelStyle}>
                          {item.channel}
                        </p>
                      )}

                      <p style={itemMetaStyle}>
                        {item.sectionLabel} •{" "}
                        {formatDate(
                          item.watchedAt
                        )}
                      </p>
                    </div>
                  </label>
                )
              )}
            </div>
          </>
        ))}
      </section>
    </main>
  );
}

const sectionStyle:
  React.CSSProperties = {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    border:
      "1px solid rgba(148,163,184,0.2)",
    background:
      "linear-gradient(145deg, #192544, #121a31)",
  };

const sectionHeaderStyle:
  React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 18,
  };

const sectionHeaderActionsStyle:
  React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    gap: 9,
  };

const manageButtonStyle:
  React.CSSProperties = {
    minHeight: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid rgba(96,165,250,0.38)",
    color: "#dbeafe",
    background: "rgba(37,99,235,0.16)",
    cursor: "pointer",
    fontWeight: 750,
  };

const chevronStyle:
  React.CSSProperties = {
    display: "inline-block",
    fontSize: 14,
    lineHeight: 1,
    transition: "transform 180ms ease",
  };

const sectionTitleStyle:
  React.CSSProperties = {
    margin: 0,
    fontSize: 20,
  };

const sectionDescriptionStyle:
  React.CSSProperties = {
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: 14,
  };

const countBadgeStyle:
  React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 35,
    minHeight: 30,
    padding: "4px 10px",
    borderRadius: 999,
    color: "#c4b5fd",
    background:
      "rgba(124,58,237,0.18)",
    fontSize: 12,
    fontWeight: 800,
  };

const actionRowStyle:
  React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  };

const selectAllStyle:
  React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#dbeafe",
    fontSize: 14,
    cursor: "pointer",
  };

const buttonGroupStyle:
  React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  };

const historyListStyle:
  React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    maxHeight: 500,
    overflowY: "auto",
  };

const historyItemStyle:
  React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 13,
    minHeight: 64,
    padding: 12,
    borderRadius: 12,
    border:
      "1px solid rgba(148,163,184,0.16)",
    cursor: "pointer",
  };

const checkboxStyle:
  React.CSSProperties = {
    width: 18,
    height: 18,
    flexShrink: 0,
    accentColor: "#a855f7",
    cursor: "pointer",
  };

const thumbnailStyle:
  React.CSSProperties = {
    width: 90,
    height: 52,
    flexShrink: 0,
    borderRadius: 8,
    objectFit: "cover",
    background: "#050714",
  };

const itemTitleStyle:
  React.CSSProperties = {
    margin: 0,
    overflow: "hidden",
    color: "white",
    fontSize: 14,
    fontWeight: 750,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

const channelStyle:
  React.CSSProperties = {
    margin: "4px 0 0",
    overflow: "hidden",
    color: "#cbd5e1",
    fontSize: 12,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

const itemMetaStyle:
  React.CSSProperties = {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: 11,
    textTransform: "capitalize",
  };

const dangerButtonStyle:
  React.CSSProperties = {
    minHeight: 40,
    padding: "8px 14px",
    borderRadius: 10,
    border: "none",
    color: "white",
    background:
      "linear-gradient(135deg, #dc2626, #ec4899)",
    cursor: "pointer",
    fontWeight: 750,
  };

const secondaryDangerButtonStyle:
  React.CSSProperties = {
    minHeight: 40,
    padding: "8px 14px",
    borderRadius: 10,
    border:
      "1px solid rgba(248,113,113,0.4)",
    color: "#fecaca",
    background:
      "rgba(127,29,29,0.25)",
    cursor: "pointer",
    fontWeight: 750,
  };

const successBoxStyle:
  React.CSSProperties = {
    marginBottom: 18,
    padding: 14,
    borderRadius: 12,
    color: "#bbf7d0",
    background:
      "rgba(22,101,52,0.25)",
    border:
      "1px solid rgba(74,222,128,0.35)",
  };

const errorBoxStyle:
  React.CSSProperties = {
    marginBottom: 18,
    padding: 14,
    borderRadius: 12,
    color: "#fecaca",
    background:
      "rgba(127,29,29,0.25)",
    border:
      "1px solid rgba(248,113,113,0.35)",
  };

const emptyTextStyle:
  React.CSSProperties = {
    margin: 0,
    color: "#94a3b8",
  };
