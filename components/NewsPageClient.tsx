"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";

import NewsAudioPlayer, {
  type NewsSpeechRequest,
} from "./NewsAudioPlayer";
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_LABELS,
  cacheNewsArticles,
  formatNewsDate,
  getNewsBookmarks,
  getNewsHistory,
  isNewsBookmarked,
  toggleNewsBookmark,
  type NewsArticle,
  type NewsCategory,
  type NewsPeriod,
} from "@/lib/news";

type NewsResponse = {
  articles?: NewsArticle[];
  nextPage?: string | number | null;
  provider?: string;
  notice?: string;
  error?: string;
};

type DateRange = {
  start: string;
  end: string;
  label: string;
};

type StoryCluster = {
  id: string;
  primary: NewsArticle;
  related: NewsArticle[];
};

const PERIOD_OPTIONS: Array<{
  id: NewsPeriod;
  label: string;
}> = [
  { id: "today", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "custom", label: "Custom" },
];

const CATEGORY_ICONS: Record<
  NewsCategory,
  string
> = {
  top: "📰",
  local: "📍",
  india: "🇮🇳",
  world: "🌍",
  technology: "💻",
  business: "📈",
  sports: "🏏",
  entertainment: "🎬",
  health: "✚",
};

const CATEGORY_TOPICS: Record<
  NewsCategory,
  string[]
> = {
  top: [
    "Latest",
    "Breaking",
    "Politics",
    "Weather",
    "Education",
  ],
  local: [
    "Latest",
    "Andhra Pradesh",
    "Telangana",
    "Hyderabad",
    "Visakhapatnam",
  ],
  india: [
    "Latest",
    "Politics",
    "Government",
    "Education",
    "Weather",
  ],
  world: [
    "Latest",
    "Asia",
    "Europe",
    "Americas",
    "Middle East",
  ],
  technology: [
    "Latest",
    "Artificial Intelligence",
    "Gadgets",
    "Software",
    "Science",
  ],
  business: [
    "Latest",
    "Economy",
    "Markets",
    "Companies",
    "Personal Finance",
  ],
  sports: [
    "Latest",
    "Cricket",
    "Football",
    "Badminton",
    "Tennis",
  ],
  entertainment: [
    "Latest",
    "Telugu Cinema",
    "Movies",
    "Television",
    "Celebrities",
  ],
  health: [
    "Latest",
    "Medication",
    "Healthcare",
    "Mental Health",
    "Nutrition",
    "Fitness",
  ],
};

const TITLE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
]);

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6.5 3.5h11v17l-5.5-3.3-5.5 3.3z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 4v5h5" />
      <path d="M5.2 8.8A8 8 0 1 1 4 13" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 10v4h4l5 4V6l-5 4z" />
      <path d="M16 9.5a4 4 0 0 1 0 5" />
    </svg>
  );
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + difference);
  return result;
}

function resolveDateRange({
  period,
  day,
  weekDay,
  month,
  year,
  customStart,
  customEnd,
}: {
  period: NewsPeriod | "";
  day: string;
  weekDay: string;
  month: string;
  year: string;
  customStart: string;
  customEnd: string;
}): DateRange | null {
  if (!period) return null;

  if (period === "today") {
    if (!day) return null;

    return {
      start: day,
      end: day,
      label: new Date(
        `${day}T12:00:00`
      ).toLocaleDateString("en-IN", {
        dateStyle: "long",
      }),
    };
  }

  if (period === "week") {
    if (!weekDay) return null;

    const selected = new Date(
      `${weekDay}T12:00:00`
    );
    const start = startOfWeek(selected);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
      start: toDateInput(start),
      end: toDateInput(end),
      label: `${start.toLocaleDateString(
        "en-IN",
        { dateStyle: "medium" }
      )} – ${end.toLocaleDateString("en-IN", {
        dateStyle: "medium",
      })}`,
    };
  }

  if (period === "month") {
    if (!month) return null;

    const [selectedYear, selectedMonth] =
      month.split("-").map(Number);
    const end = new Date(
      selectedYear,
      selectedMonth,
      0
    );

    return {
      start: `${month}-01`,
      end: toDateInput(end),
      label: new Date(
        selectedYear,
        selectedMonth - 1,
        1
      ).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    };
  }

  if (period === "year") {
    if (!year) return null;

    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      label: year,
    };
  }

  if (!customStart || !customEnd) {
    return null;
  }

  return {
    start: customStart,
    end: customEnd,
    label: `${new Date(
      `${customStart}T12:00:00`
    ).toLocaleDateString("en-IN", {
      dateStyle: "medium",
    })} – ${new Date(
      `${customEnd}T12:00:00`
    ).toLocaleDateString("en-IN", {
      dateStyle: "medium",
    })}`,
  };
}

function titleTerms(title: string) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2 &&
          !TITLE_STOP_WORDS.has(word)
      )
  );
}

function titleSimilarity(
  first: string,
  second: string
) {
  const firstTerms = titleTerms(first);
  const secondTerms = titleTerms(second);

  if (
    firstTerms.size === 0 ||
    secondTerms.size === 0
  ) {
    return 0;
  }

  let matches = 0;

  for (const term of firstTerms) {
    if (secondTerms.has(term)) {
      matches += 1;
    }
  }

  return (
    matches /
    Math.min(
      firstTerms.size,
      secondTerms.size
    )
  );
}

function buildStoryClusters(
  articles: NewsArticle[]
): StoryCluster[] {
  const remaining = [...articles];
  const clusters: StoryCluster[] = [];

  while (remaining.length > 0) {
    const primary = remaining.shift();

    if (!primary) break;

    const related: NewsArticle[] = [];

    for (
      let index = 0;
      index < remaining.length &&
      related.length < 3;
      index += 1
    ) {
      if (
        titleSimilarity(
          primary.title,
          remaining[index].title
        ) >= 0.28
      ) {
        related.push(
          remaining.splice(index, 1)[0]
        );
        index -= 1;
      }
    }

    while (
      related.length < 3 &&
      remaining.length > 0
    ) {
      related.push(remaining.shift()!);
    }

    clusters.push({
      id: primary.id,
      primary,
      related,
    });
  }

  return clusters;
}

function sourceFavicon(article: NewsArticle) {
  const source =
    article.sourceUrl || article.url;

  try {
    const domain = new URL(source).hostname;

    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      domain
    )}&sz=64`;
  } catch {
    return "";
  }
}

function NewsImage({
  article,
}: {
  article: NewsArticle;
}) {
  const [failed, setFailed] = useState(false);

  if (!article.imageUrl || failed) {
    return (
      <div className="google-news-image-fallback">
        <span>📰</span>
      </div>
    );
  }

  return (
    <img
      className="google-news-main-image"
      src={article.imageUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function SourceLabel({
  article,
}: {
  article: NewsArticle;
}) {
  const favicon = sourceFavicon(article);

  return (
    <span className="google-news-source">
      {favicon && (
        <img
          src={favicon}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      <strong>{article.sourceName}</strong>
    </span>
  );
}

export default function NewsPageClient() {
  const today = useMemo(() => new Date(), []);
  const todayInput = useMemo(
    () => toDateInput(today),
    [today]
  );
  const currentMonth = useMemo(
    () => todayInput.slice(0, 7),
    [todayInput]
  );
  const currentYear = String(
    today.getFullYear()
  );

  const [period, setPeriod] = useState<
    NewsPeriod | ""
  >("");
  const [category, setCategory] = useState<
    NewsCategory | ""
  >("");
  const [topic, setTopic] = useState("Latest");
  const [day, setDay] = useState(todayInput);
  const [weekDay, setWeekDay] =
    useState(todayInput);
  const [month, setMonth] =
    useState(currentMonth);
  const [year, setYear] =
    useState(currentYear);
  const [customStart, setCustomStart] =
    useState(todayInput);
  const [customEnd, setCustomEnd] =
    useState(todayInput);
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<
    NewsArticle[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] =
    useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [provider, setProvider] = useState("");
  const [nextPage, setNextPage] = useState<
    string | number | null
  >(null);
  const [loadedRange, setLoadedRange] =
    useState<DateRange | null>(null);
  const [loadedCategory, setLoadedCategory] =
    useState<NewsCategory | null>(null);
  const [speechRequest, setSpeechRequest] =
    useState<NewsSpeechRequest | null>(null);
  const [bookmarkVersion, setBookmarkVersion] =
    useState(0);
  const [showBookmarks, setShowBookmarks] =
    useState(false);
  const [showHistory, setShowHistory] =
    useState(false);

  useEffect(() => {
    document.body.classList.add(
      "news-route-active"
    );

    return () => {
      document.body.classList.remove(
        "news-route-active"
      );
    };
  }, []);

  const range = resolveDateRange({
    period,
    day,
    weekDay,
    month,
    year,
    customStart,
    customEnd,
  });

  const years = useMemo(() => {
    const first = today.getFullYear();

    return Array.from(
      { length: 10 },
      (_, index) => String(first - index)
    );
  }, [today]);

  const displayedArticles = showBookmarks
    ? getNewsBookmarks()
    : showHistory
      ? getNewsHistory()
      : articles;

  const clusters = useMemo(
    () => buildStoryClusters(displayedArticles),
    [displayedArticles, bookmarkVersion]
  );

  const activeDisplayCategory =
    loadedCategory ||
    (category || null);

  const selectedTopics = category
    ? CATEGORY_TOPICS[category]
    : [];

  function clearLoadedResults() {
    setArticles([]);
    setLoadedRange(null);
    setLoadedCategory(null);
    setNextPage(null);
    setProvider("");
    setNotice("");
    setError("");
  }

  async function fetchNews({
    reset,
    page,
  }: {
    reset: boolean;
    page?: string | number | null;
  }) {
    if (!range) {
      setError(
        "Select a time period and date before searching."
      );
      return;
    }

    if (!category) {
      setError(
        "Select exactly one news category before searching."
      );
      return;
    }

    reset
      ? setLoading(true)
      : setLoadingMore(true);
    setError("");

    try {
      const topicQuery =
        topic !== "Latest" ? topic : "";
      const combinedQuery = [
        topicQuery,
        query.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const params = new URLSearchParams({
        category,
        start: range.start,
        end: range.end,
      });

      if (combinedQuery) {
        params.set("q", combinedQuery);
      }

      if (
        page !== undefined &&
        page !== null
      ) {
        params.set("page", String(page));
      }

      const response = await fetch(
        `/api/news?${params.toString()}`,
        { cache: "no-store" }
      );
      const contentType =
        response.headers.get(
          "content-type"
        ) || "";
      const data = contentType.includes(
        "application/json"
      )
        ? ((await response.json()) as NewsResponse)
        : ({
            error:
              "Google News returned an unexpected response.",
          } as NewsResponse);

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load Google News right now."
        );
      }

      const incoming = Array.isArray(
        data.articles
      )
        ? data.articles
        : [];

      cacheNewsArticles(incoming);

      setArticles((current) => {
        const combined = reset
          ? incoming
          : [...current, ...incoming];
        const unique = new Map<
          string,
          NewsArticle
        >();

        for (const article of combined) {
          unique.set(article.id, article);
        }

        return Array.from(unique.values());
      });

      setNextPage(data.nextPage ?? null);
      setNotice(data.notice || "");
      setProvider(data.provider || "");
      setLoadedRange(range);
      setLoadedCategory(category);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Google News.";

      setError(
        message === "fetch failed" ||
          message.includes("Failed to fetch")
          ? "Google News could not be reached. Please try again."
          : message
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function submitNews(event: FormEvent) {
    event.preventDefault();
    setShowBookmarks(false);
    setShowHistory(false);
    setArticles([]);
    setNextPage(null);
    void fetchNews({ reset: true });
  }

  function chooseCategory(
    nextCategory: NewsCategory
  ) {
    setCategory(nextCategory);
    setTopic("Latest");
    setShowBookmarks(false);
    setShowHistory(false);
    clearLoadedResults();
  }

  function listenToArticle(
    article: NewsArticle
  ) {
    setSpeechRequest({
      id: `${article.id}-${Date.now()}`,
      label: article.title,
      text: [
        article.title,
        article.summary,
      ].join(". "),
    });
  }

  function bookmark(article: NewsArticle) {
    toggleNewsBookmark(article);
    setBookmarkVersion(
      (value) => value + 1
    );
  }

  function openBookmarks() {
    setShowBookmarks(true);
    setShowHistory(false);
    setError("");
    setNotice("");
    setProvider("");
  }

  function openHistory() {
    setShowHistory(true);
    setShowBookmarks(false);
    setError("");
    setNotice("");
    setProvider("");
  }

  return (
    <section className="news-shell news-google-shell">
      <form
        className="google-news-topbar"
        onSubmit={submitNews}
      >
        <div className="google-news-searchbox">
          <SearchIcon />

          <input
            type="search"
            value={query}
            placeholder="Search for topics, locations and sources"
            aria-label="Search Google News"
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={
              !range ||
              !category ||
              loading
            }
            aria-label="Search news"
          >
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        <div className="google-news-library-actions">
          <button
            type="button"
            className={
              showBookmarks ? "active" : ""
            }
            onClick={openBookmarks}
            title="Saved stories"
          >
            <BookmarkIcon />
            <span>Saved</span>
          </button>

          <button
            type="button"
            className={
              showHistory ? "active" : ""
            }
            onClick={openHistory}
            title="Reading history"
          >
            <HistoryIcon />
            <span>History</span>
          </button>
        </div>
      </form>

      <nav
        className="google-news-category-nav"
        aria-label="News categories"
      >
        {NEWS_CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            className={
              category === item
                ? "active"
                : ""
            }
            aria-pressed={category === item}
            onClick={() =>
              chooseCategory(item)
            }
          >
            {NEWS_CATEGORY_LABELS[item]}
          </button>
        ))}
      </nav>

      <div className="google-news-filterbar">
        <div className="google-news-periods">
          <strong>Time period</strong>

          {PERIOD_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.id}
              className={
                period === option.id
                  ? "active"
                  : ""
              }
              onClick={() => {
                setPeriod(option.id);
                setShowBookmarks(false);
                setShowHistory(false);
                clearLoadedResults();
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="google-news-date-control">
          {!period && (
            <span>
              Select a period
            </span>
          )}

          {period === "today" && (
            <input
              type="date"
              value={day}
              max={todayInput}
              aria-label="Choose day"
              onChange={(event) =>
                setDay(event.target.value)
              }
            />
          )}

          {period === "week" && (
            <input
              type="date"
              value={weekDay}
              max={todayInput}
              aria-label="Choose a day in the week"
              onChange={(event) =>
                setWeekDay(
                  event.target.value
                )
              }
            />
          )}

          {period === "month" && (
            <input
              type="month"
              value={month}
              max={currentMonth}
              aria-label="Choose month"
              onChange={(event) =>
                setMonth(
                  event.target.value
                )
              }
            />
          )}

          {period === "year" && (
            <select
              value={year}
              aria-label="Choose year"
              onChange={(event) =>
                setYear(
                  event.target.value
                )
              }
            >
              {years.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          )}

          {period === "custom" && (
            <div className="google-news-custom-range">
              <input
                type="date"
                value={customStart}
                max={customEnd || todayInput}
                aria-label="Start date"
                onChange={(event) =>
                  setCustomStart(
                    event.target.value
                  )
                }
              />

              <span>to</span>

              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={todayInput}
                aria-label="End date"
                onChange={(event) =>
                  setCustomEnd(
                    event.target.value
                  )
                }
              />
            </div>
          )}
        </div>

        <div className="google-news-required-status">
          {!category
            ? "Choose one category"
            : !range
              ? "Choose a time period"
              : "Ready to search"}
        </div>
      </div>

      {!showBookmarks &&
        !showHistory &&
        activeDisplayCategory && (
        <header className="google-news-topic-header">
          <div className="google-news-topic-title">
            <span aria-hidden="true">
              {
                CATEGORY_ICONS[
                  activeDisplayCategory
                ]
              }
            </span>

            <h1>
              {
                NEWS_CATEGORY_LABELS[
                  activeDisplayCategory
                ]
              }
            </h1>
          </div>

          <div className="google-news-topic-chips">
            {CATEGORY_TOPICS[
              activeDisplayCategory
            ].map((item) => (
              <button
                type="button"
                key={item}
                className={
                  topic === item
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setTopic(item);
                  setShowBookmarks(false);
                  setShowHistory(false);
                  clearLoadedResults();
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </header>
      )}

      <main className="google-news-results">
        {showBookmarks && (
          <div className="google-news-view-heading">
            <div>
              <BookmarkIcon />
              <h1>Saved stories</h1>
            </div>
            <span>
              {displayedArticles.length} saved
            </span>
          </div>
        )}

        {showHistory && (
          <div className="google-news-view-heading">
            <div>
              <HistoryIcon />
              <h1>Reading history</h1>
            </div>
            <span>
              {displayedArticles.length} viewed
            </span>
          </div>
        )}

        {!showBookmarks &&
          !showHistory &&
          loadedRange &&
          loadedCategory && (
          <div className="google-news-result-meta">
            <span>{loadedRange.label}</span>
            <strong>
              {articles.length} stories
            </strong>
          </div>
        )}

        {!showBookmarks &&
          !showHistory &&
          !loadedRange &&
          !loading && (
          <div className="google-news-empty">
            <span>🗞️</span>
            <h2>
              Select one category and a time period
            </h2>
            <p>
              News is not loaded until both required
              filters are selected and Search is pressed.
            </p>
          </div>
        )}

        {loading && (
          <div className="google-news-loading">
            <span />
            <p>Loading Google News…</p>
          </div>
        )}

        {notice &&
          !showBookmarks &&
          !showHistory && (
          <p className="google-news-notice">
            {notice}
          </p>
        )}

        {provider &&
          !showBookmarks &&
          !showHistory && (
          <p className="google-news-provider">
            Results from {provider}
          </p>
        )}

        {error && (
          <div
            className="google-news-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading &&
          loadedRange &&
          !showBookmarks &&
          !showHistory &&
          articles.length === 0 &&
          !error && (
          <div className="google-news-empty compact">
            <h2>No matching stories found</h2>
            <p>
              Try another period, category, topic,
              or search term.
            </p>
          </div>
        )}

        {showBookmarks &&
          displayedArticles.length === 0 && (
          <div className="google-news-empty compact">
            <h2>No saved stories</h2>
            <p>
              Save a story to find it here.
            </p>
          </div>
        )}

        {showHistory &&
          displayedArticles.length === 0 && (
          <div className="google-news-empty compact">
            <h2>No reading history</h2>
            <p>
              Open a story and it will appear here.
            </p>
          </div>
        )}

        {clusters.length > 0 && (
          <div className="google-news-clusters">
            {clusters.map((cluster) => {
              const primaryBookmarked =
                isNewsBookmarked(
                  cluster.primary.id
                );

              return (
                <article
                  className="google-news-cluster"
                  key={`${cluster.id}-${bookmarkVersion}`}
                >
                  <div className="google-news-primary">
                    <Link
                      href={`/news/${encodeURIComponent(
                        cluster.primary.id
                      )}`}
                      className="google-news-primary-media"
                      onClick={() =>
                        cacheNewsArticles([
                          cluster.primary,
                        ])
                      }
                    >
                      <NewsImage
                        article={cluster.primary}
                      />
                    </Link>

                    <div className="google-news-primary-copy">
                      <SourceLabel
                        article={cluster.primary}
                      />

                      <h2>
                        <Link
                          href={`/news/${encodeURIComponent(
                            cluster.primary.id
                          )}`}
                          onClick={() =>
                            cacheNewsArticles([
                              cluster.primary,
                            ])
                          }
                        >
                          {cluster.primary.title}
                        </Link>
                      </h2>

                      <p>
                        {cluster.primary.summary}
                      </p>

                      <div className="google-news-story-time">
                        <time>
                          {formatNewsDate(
                            cluster.primary
                              .publishedAt
                          )}
                        </time>
                      </div>

                      <div className="google-news-story-actions">
                        <button
                          type="button"
                          onClick={() =>
                            listenToArticle(
                              cluster.primary
                            )
                          }
                        >
                          <SpeakerIcon />
                          Listen
                        </button>

                        <button
                          type="button"
                          className={
                            primaryBookmarked
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            bookmark(
                              cluster.primary
                            )
                          }
                        >
                          <BookmarkIcon />
                          {primaryBookmarked
                            ? "Saved"
                            : "Save"}
                        </button>

                        <Link
                          href={`/news/${encodeURIComponent(
                            cluster.primary.id
                          )}`}
                          onClick={() =>
                            cacheNewsArticles([
                              cluster.primary,
                            ])
                          }
                        >
                          Read story
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="google-news-related">
                    {cluster.related.map(
                      (article) => (
                        <article
                          className="google-news-related-item"
                          key={article.id}
                        >
                          <SourceLabel
                            article={article}
                          />

                          <h3>
                            <Link
                              href={`/news/${encodeURIComponent(
                                article.id
                              )}`}
                              onClick={() =>
                                cacheNewsArticles([
                                  article,
                                ])
                              }
                            >
                              {article.title}
                            </Link>
                          </h3>

                          <time>
                            {formatNewsDate(
                              article.publishedAt
                            )}
                          </time>
                        </article>
                      )
                    )}

                    {cluster.related.length >
                      0 && (
                      <div className="google-news-more-perspectives">
                        More headlines and perspectives
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!showBookmarks &&
          !showHistory &&
          nextPage !== null && (
          <button
            type="button"
            className="google-news-load-more"
            disabled={loadingMore}
            onClick={() =>
              void fetchNews({
                reset: false,
                page: nextPage,
              })
            }
          >
            {loadingMore
              ? "Loading more…"
              : "Load more stories"}
          </button>
        )}
      </main>

      <NewsAudioPlayer
        request={speechRequest}
        onClose={() =>
          setSpeechRequest(null)
        }
      />
    </section>
  );
}
