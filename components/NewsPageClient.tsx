"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import NewsAudioPlayer, {
  type NewsSpeechRequest,
} from "./NewsAudioPlayer";
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_LABELS,
  cacheNewsArticles,
  estimateReadingMinutes,
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

const PERIOD_OPTIONS: Array<{
  id: NewsPeriod;
  label: string;
  helper: string;
}> = [
  {
    id: "today",
    label: "Day",
    helper: "Choose one day",
  },
  {
    id: "week",
    label: "Week",
    helper: "Choose a week",
  },
  {
    id: "month",
    label: "Month",
    helper: "Choose a month",
  },
  {
    id: "year",
    label: "Year",
    helper: "Choose a year",
  },
  {
    id: "custom",
    label: "Custom",
    helper: "Choose a date range",
  },
];

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

function NewsImage({
  article,
}: {
  article: NewsArticle;
}) {
  const [failed, setFailed] = useState(false);

  if (!article.imageUrl || failed) {
    return (
      <div className="news-card-image news-card-image-fallback">
        <span>3D</span>
        <strong>NEWS</strong>
      </div>
    );
  }

  return (
    <img
      className="news-card-image"
      src={article.imageUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
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
  const currentYear = String(today.getFullYear());

  const [period, setPeriod] = useState<
    NewsPeriod | ""
  >("");
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
  const [category, setCategory] =
    useState<NewsCategory>("top");
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

  async function fetchNews({
    reset,
    page,
  }: {
    reset: boolean;
    page?: string | number | null;
  }) {
    if (!range) {
      setError(
        "Choose a day, week, month, year, or custom range first."
      );
      return;
    }

    reset
      ? setLoading(true)
      : setLoadingMore(true);
    setError("");

    try {
      const params = new URLSearchParams({
        category,
        start: range!.start,
        end: range!.end,
      });

      if (query.trim()) {
        params.set("q", query.trim());
      }

      if (page !== undefined && page !== null) {
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
              "The news service returned an unexpected response.",
          } as NewsResponse);

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load news right now."
        );
      }

      const incoming = Array.isArray(data.articles)
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
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to load news.";

      setError(
        message === "fetch failed" ||
          message.includes(
            "Failed to fetch"
          )
          ? "The live news service could not be reached. Please try again."
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

  function listenToArticle(article: NewsArticle) {
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
    setBookmarkVersion((value) => value + 1);
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
    <section className="news-shell">
      <header className="news-hero">
        <div className="news-hero-kicker">
          Independent news reader
        </div>
        <h1>3D Hub News</h1>
        <p>
          Choose a time period first, then read concise
          text stories with related images, video when
          available, and selectable text-to-speech.
        </p>
      </header>

      <form
        className="news-control-panel"
        onSubmit={submitNews}
      >
        <div className="news-control-heading">
          <div>
            <span>Step 1</span>
            <h2>Select a time period</h2>
          </div>

          <div className="news-library-buttons">
            <button
              type="button"
              className={`news-bookmarks-button ${
                showBookmarks ? "active" : ""
              }`}
              onClick={openBookmarks}
            >
              Saved stories
            </button>
            <button
              type="button"
              className={`news-bookmarks-button ${
                showHistory ? "active" : ""
              }`}
              onClick={openHistory}
            >
              Reading history
            </button>
          </div>
        </div>

        <div className="news-period-grid">
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
                setArticles([]);
                setLoadedRange(null);
                setError("");
              }}
            >
              <strong>{option.label}</strong>
              <span>{option.helper}</span>
            </button>
          ))}
        </div>

        {period && (
          <div className="news-date-fields">
            {period === "today" && (
              <label>
                <span>Choose day</span>
                <input
                  type="date"
                  value={day}
                  max={todayInput}
                  onChange={(event) =>
                    setDay(event.target.value)
                  }
                />
              </label>
            )}

            {period === "week" && (
              <label>
                <span>Choose any day in the week</span>
                <input
                  type="date"
                  value={weekDay}
                  max={todayInput}
                  onChange={(event) =>
                    setWeekDay(event.target.value)
                  }
                />
              </label>
            )}

            {period === "month" && (
              <label>
                <span>Choose month</span>
                <input
                  type="month"
                  value={month}
                  max={currentMonth}
                  onChange={(event) =>
                    setMonth(event.target.value)
                  }
                />
              </label>
            )}

            {period === "year" && (
              <label>
                <span>Choose year</span>
                <select
                  value={year}
                  onChange={(event) =>
                    setYear(event.target.value)
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
              </label>
            )}

            {period === "custom" && (
              <>
                <label>
                  <span>From</span>
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd || todayInput}
                    onChange={(event) =>
                      setCustomStart(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span>To</span>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    max={todayInput}
                    onChange={(event) =>
                      setCustomEnd(
                        event.target.value
                      )
                    }
                  />
                </label>
              </>
            )}
          </div>
        )}

        <div className="news-filter-block">
          <div>
            <span>Step 2</span>
            <h2>Choose a category</h2>
          </div>

          <div className="news-category-row">
            {NEWS_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  category === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory(item)
                }
              >
                {NEWS_CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="news-search-row">
          <label>
            <span>Optional keyword</span>
            <input
              type="search"
              value={query}
              placeholder="Example: AI, cricket, Andhra Pradesh"
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />
          </label>

          <button
            type="submit"
            className="news-load-button"
            disabled={!range || loading}
          >
            {loading ? "Loading…" : "Show news"}
          </button>
        </div>
      </form>

      <div className="news-results">
        {showBookmarks ? (
          <div className="news-results-heading">
            <div>
              <span>Your private news list</span>
              <h2>Saved stories</h2>
            </div>
            <strong>
              {displayedArticles.length} saved
            </strong>
          </div>
        ) : showHistory ? (
          <div className="news-results-heading">
            <div>
              <span>Stored only in this browser</span>
              <h2>Reading history</h2>
            </div>
            <strong>
              {displayedArticles.length} viewed
            </strong>
          </div>
        ) : loadedRange ? (
          <div className="news-results-heading">
            <div>
              <span>
                {NEWS_CATEGORY_LABELS[category]}
              </span>
              <h2>{loadedRange.label}</h2>
            </div>
            <strong>
              {articles.length} stories
            </strong>
          </div>
        ) : (
          <div className="news-empty-state">
            <span>🗓️</span>
            <h2>Select when you want news from</h2>
            <p>
              No stories load automatically. Choose a
              day, week, month, year, or custom range,
              then press Show news.
            </p>
          </div>
        )}

        {notice && !showBookmarks && !showHistory && (
          <p className="news-notice">
            {notice}
          </p>
        )}

        {provider && !showBookmarks && !showHistory && (
          <p className="news-provider-label">
            Feed provider: {provider}
          </p>
        )}

        {error && (
          <div className="news-error" role="alert">
            {error}
          </div>
        )}

        {!loading &&
          loadedRange &&
          !showBookmarks &&
          !showHistory &&
          articles.length === 0 &&
          !error && (
            <div className="news-empty-state compact">
              <h2>No matching stories found</h2>
              <p>
                Try another date range, category, or
                keyword.
              </p>
            </div>
          )}

        {showBookmarks &&
          displayedArticles.length === 0 && (
            <div className="news-empty-state compact">
              <h2>No saved stories yet</h2>
              <p>
                Use the Save button on any news card.
              </p>
            </div>
          )}

        {showHistory &&
          displayedArticles.length === 0 && (
            <div className="news-empty-state compact">
              <h2>No reading history yet</h2>
              <p>
                Stories appear here after you open them.
              </p>
            </div>
          )}

        {displayedArticles.length > 0 && (
          <div className="news-card-grid">
            {displayedArticles.map((article) => {
              const bookmarked = isNewsBookmarked(
                article.id
              );

              return (
                <article
                  className="news-card"
                  key={`${article.id}-${bookmarkVersion}`}
                >
                  <Link
                    href={`/news/${encodeURIComponent(
                      article.id
                    )}`}
                    className="news-card-media"
                    onClick={() =>
                      cacheNewsArticles([article])
                    }
                  >
                    <NewsImage article={article} />
                    <span className="news-card-category">
                      {
                        NEWS_CATEGORY_LABELS[
                          article.category
                        ]
                      }
                    </span>
                  </Link>

                  <div className="news-card-content">
                    <div className="news-card-meta">
                      <span>{article.sourceName}</span>
                      <time>
                        {formatNewsDate(
                          article.publishedAt
                        )}
                      </time>
                    </div>

                    <h3>
                      <Link
                        href={`/news/${encodeURIComponent(
                          article.id
                        )}`}
                        onClick={() =>
                          cacheNewsArticles([article])
                        }
                      >
                        {article.title}
                      </Link>
                    </h3>

                    <p>{article.summary}</p>

                    <div className="news-card-reading-time">
                      {estimateReadingMinutes(article)} min
                      read
                      {article.videoUrl
                        ? " · Video available"
                        : ""}
                    </div>

                    <div className="news-card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          listenToArticle(article)
                        }
                      >
                        🔊 Listen
                      </button>

                      <Link
                        href={`/news/${encodeURIComponent(
                          article.id
                        )}`}
                        onClick={() =>
                          cacheNewsArticles([article])
                        }
                      >
                        Read story
                      </Link>

                      <button
                        type="button"
                        className={
                          bookmarked ? "active" : ""
                        }
                        onClick={() => bookmark(article)}
                      >
                        {bookmarked
                          ? "Saved"
                          : "Save"}
                      </button>
                    </div>
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
            className="news-more-button"
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
      </div>

      <NewsAudioPlayer
        request={speechRequest}
        onClose={() => setSpeechRequest(null)}
      />
    </section>
  );
}
