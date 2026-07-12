export const NEWS_CATEGORIES = [
  "top",
  "local",
  "india",
  "world",
  "technology",
  "business",
  "sports",
  "entertainment",
  "health",
] as const;

export type NewsCategory =
  (typeof NEWS_CATEGORIES)[number];

export type NewsPeriod =
  | "today"
  | "week"
  | "month"
  | "year"
  | "custom";

export type NewsProvider =
  | "newsdata"
  | "gdelt";

export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  sourceName: string;
  sourceUrl?: string;
  url: string;
  publishedAt: string;
  category: NewsCategory;
  language?: string;
  country?: string;
  provider?: NewsProvider;
};

export type NewsSection = {
  id: string;
  title: string;
  text: string;
};

export const NEWS_CATEGORY_LABELS: Record<
  NewsCategory,
  string
> = {
  top: "Top Stories",
  local: "Local",
  india: "India",
  world: "World",
  technology: "Technology",
  business: "Business",
  sports: "Sports",
  entertainment: "Entertainment",
  health: "Health",
};

const NEWS_CACHE_KEY =
  "3d-hub-news-article-cache-v1";
const NEWS_BOOKMARKS_KEY =
  "3d-hub-news-bookmarks-v1";
const NEWS_HISTORY_KEY =
  "3d-hub-news-history-v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readArticles(key: string) {
  if (!canUseStorage()) {
    return [] as NewsArticle[];
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(key) || "[]"
    );

    return Array.isArray(parsed)
      ? (parsed as NewsArticle[])
      : [];
  } catch {
    return [] as NewsArticle[];
  }
}

function writeArticles(
  key: string,
  articles: NewsArticle[]
) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(articles)
    );
  } catch {
    // Storage can be unavailable in private/restricted modes.
  }
}

export function cacheNewsArticles(
  articles: NewsArticle[]
) {
  const existing = readArticles(NEWS_CACHE_KEY);
  const merged = new Map<string, NewsArticle>();

  for (const article of [
    ...articles,
    ...existing,
  ]) {
    if (article?.id) {
      merged.set(article.id, article);
    }
  }

  writeArticles(
    NEWS_CACHE_KEY,
    Array.from(merged.values()).slice(0, 300)
  );
}

export function getCachedNewsArticle(
  id: string
) {
  return readArticles(NEWS_CACHE_KEY).find(
    (article) => article.id === id
  );
}

export function getNewsBookmarks() {
  return readArticles(NEWS_BOOKMARKS_KEY);
}

export function getNewsHistory() {
  return readArticles(NEWS_HISTORY_KEY);
}

export function isNewsBookmarked(id: string) {
  return getNewsBookmarks().some(
    (article) => article.id === id
  );
}

export function toggleNewsBookmark(
  article: NewsArticle
) {
  const current = getNewsBookmarks();
  const exists = current.some(
    (item) => item.id === article.id
  );

  const next = exists
    ? current.filter(
        (item) => item.id !== article.id
      )
    : [article, ...current].slice(0, 200);

  writeArticles(NEWS_BOOKMARKS_KEY, next);
  return !exists;
}

export function addNewsHistory(
  article: NewsArticle
) {
  const current = readArticles(NEWS_HISTORY_KEY);
  const next = [
    article,
    ...current.filter(
      (item) => item.id !== article.id
    ),
  ].slice(0, 150);

  writeArticles(NEWS_HISTORY_KEY, next);
}

export function formatNewsDate(
  value: string
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function estimateReadingMinutes(
  article: NewsArticle
) {
  const text = [
    article.summary,
    article.content || "",
  ].join(" ");
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 190));
}

export function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function buildNewsSections(
  article: NewsArticle
): NewsSection[] {
  const summarySentences = splitSentences(
    article.summary || ""
  );
  const contentSentences = splitSentences(
    article.content || ""
  );
  const combined = Array.from(
    new Set([
      ...summarySentences,
      ...contentSentences,
    ])
  );

  if (combined.length === 0) {
    return [
      {
        id: "overview",
        title: "Overview",
        text:
          "Open the original publisher to read the complete report.",
      },
    ];
  }

  const sections: NewsSection[] = [];
  const overview = combined.slice(0, 2);
  const details = combined.slice(2, 7);
  const context = combined.slice(7);

  sections.push({
    id: "overview",
    title: "Overview",
    text: overview.join(" "),
  });

  if (details.length > 0) {
    sections.push({
      id: "details",
      title: "Details",
      text: details.join(" "),
    });
  }

  if (context.length > 0) {
    sections.push({
      id: "context",
      title: "More context",
      text: context.join(" "),
    });
  }

  return sections;
}

export function quickNewsPoints(
  article: NewsArticle
) {
  return splitSentences(
    [article.summary, article.content || ""].join(
      " "
    )
  ).slice(0, 3);
}
