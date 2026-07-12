import { NextRequest, NextResponse } from "next/server";

import {
  NEWS_CATEGORIES,
  type NewsArticle,
  type NewsCategory,
} from "@/lib/news";

export const runtime = "nodejs";

const CATEGORY_QUERIES: Record<
  NewsCategory,
  string
> = {
  top: "India",
  local:
    '"Andhra Pradesh" OR Telangana OR Telugu',
  india: "India",
  world: "world OR international",
  technology:
    "technology OR artificial intelligence OR software OR gadgets",
  business:
    "business OR economy OR markets OR companies",
  sports:
    "sports OR cricket OR football OR badminton",
  entertainment:
    "entertainment OR cinema OR movies OR television",
  health:
    "health OR medicine OR hospital OR wellness",
};

const NEWSDATA_CATEGORY_MAP: Record<
  NewsCategory,
  string
> = {
  top: "top",
  local: "top",
  india: "top",
  world: "world",
  technology: "technology",
  business: "business",
  sports: "sports",
  entertainment: "entertainment",
  health: "health",
};

function parseCategory(value: string | null) {
  if (
    value &&
    NEWS_CATEGORIES.includes(
      value as NewsCategory
    )
  ) {
    return value as NewsCategory;
  }

  return "top" as NewsCategory;
}

function cleanText(value: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stableId(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `news-${(hash >>> 0).toString(36)}`;
}

function toGdeltDate(
  value: string,
  endOfDay = false
) {
  return value.replace(/-/g, "") +
    (endOfDay ? "235959" : "000000");
}

function publisherNameFromDomain(domain: string) {
  return domain
    .replace(/^www\./, "")
    .split(".")[0]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function parseGdeltDate(value: string) {
  const normalized = String(value || "").replace(
    /[^0-9]/g,
    ""
  );

  if (normalized.length < 8) {
    return new Date().toISOString();
  }

  const year = normalized.slice(0, 4);
  const month = normalized.slice(4, 6);
  const day = normalized.slice(6, 8);
  const hour = normalized.slice(8, 10) || "00";
  const minute = normalized.slice(10, 12) || "00";
  const second = normalized.slice(12, 14) || "00";

  const date = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
  );

  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function extractMeta(
  html: string,
  key: string,
  attribute: "name" | "property"
) {
  const escaped = key.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  const first = new RegExp(
    `<meta[^>]+${attribute}=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const second = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${escaped}["'][^>]*>`,
    "i"
  );

  return cleanText(
    html.match(first)?.[1] ||
      html.match(second)?.[1] ||
      ""
  );
}

async function enrichGdeltArticle(
  article: NewsArticle
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    3500
  );

  try {
    const response = await fetch(article.url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; 3DHubNews/1.0; +https://3d-hub-lac.vercel.app/news)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) return article;

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return article;
    }

    const html = (await response.text()).slice(
      0,
      300_000
    );
    const description =
      extractMeta(
        html,
        "og:description",
        "property"
      ) ||
      extractMeta(html, "description", "name");
    const image = extractMeta(
      html,
      "og:image",
      "property"
    );

    return {
      ...article,
      summary:
        description || article.summary,
      imageUrl: article.imageUrl || image || undefined,
    };
  } catch {
    return article;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchNewsData({
  apiKey,
  category,
  start,
  end,
  query,
  page,
}: {
  apiKey: string;
  category: NewsCategory;
  start: string;
  end: string;
  query: string;
  page: string | null;
}) {
  const endDate = new Date(`${end}T23:59:59Z`);
  const twoDaysAgo = new Date(
    Date.now() - 2 * 24 * 60 * 60 * 1000
  );
  const endpoint =
    endDate >= twoDaysAgo
      ? "latest"
      : "archive";
  const params = new URLSearchParams({
    apikey: apiKey,
    language: "en",
    category: NEWSDATA_CATEGORY_MAP[category],
    from_date: start,
    to_date: end,
  });

  if (
    category === "top" ||
    category === "india"
  ) {
    params.set("country", "in");
  }

  const categoryQuery =
    category === "local"
      ? "Andhra Pradesh OR Telangana OR Telugu"
      : category === "india"
        ? "India"
        : "";
  const combinedQuery = [categoryQuery, query]
    .filter(Boolean)
    .join(" AND ");

  if (combinedQuery) {
    params.set("q", combinedQuery);
  }

  if (page) {
    params.set("page", page);
  }

  const response = await fetch(
    `https://newsdata.io/api/1/${endpoint}?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 600 },
    }
  );
  const data = await response.json();

  if (!response.ok || data.status === "error") {
    throw new Error(
      data.results?.message ||
        data.message ||
        "NewsData request failed."
    );
  }

  const results = Array.isArray(data.results)
    ? data.results
    : [];

  const articles: NewsArticle[] = results
    .map((item: Record<string, unknown>) => {
      const url = String(item.link || "");
      const title = cleanText(item.title);
      const description = cleanText(
        item.description
      );
      const content = cleanText(item.content);
      const sourceName = cleanText(
        item.source_name || item.source_id
      );
      const publishedAt = String(
        item.pubDate || new Date().toISOString()
      );

      return {
        id: String(
          item.article_id ||
            stableId(url || `${title}-${publishedAt}`)
        ),
        title,
        summary:
          description ||
          content ||
          `Latest report from ${
            sourceName || "the publisher"
          }.`,
        content: content || undefined,
        imageUrl:
          String(item.image_url || "") ||
          undefined,
        videoUrl:
          String(item.video_url || "") ||
          undefined,
        sourceName:
          sourceName || "News publisher",
        sourceUrl:
          String(item.source_url || "") ||
          undefined,
        url,
        publishedAt,
        category,
        language:
          String(item.language || "") ||
          undefined,
        country: Array.isArray(item.country)
          ? item.country.join(", ")
          : String(item.country || "") ||
            undefined,
        provider: "newsdata" as const,
      };
    })
    .filter(
      (article: NewsArticle) =>
        article.title && article.url
    );

  return {
    articles,
    nextPage: data.nextPage || null,
    provider: "NewsData.io",
    notice:
      endpoint === "archive"
        ? "Historical results depend on the archive access enabled for your NewsData.io account."
        : "",
  };
}

async function fetchGdelt({
  category,
  start,
  end,
  query,
  page,
}: {
  category: NewsCategory;
  start: string;
  end: string;
  query: string;
  page: string | null;
}) {
  const requestedEnd = new Date(`${end}T23:59:59Z`);
  const oldestSupported = new Date();
  oldestSupported.setUTCFullYear(
    oldestSupported.getUTCFullYear() - 1
  );

  if (requestedEnd < oldestSupported) {
    return {
      articles: [] as NewsArticle[],
      nextPage: null,
      provider: "GDELT",
      notice:
        "The built-in no-key feed covers approximately the latest year. Add NEWSDATA_API_KEY for older archive searches supported by your NewsData.io plan.",
    };
  }

  const requestedStart = new Date(
    `${start}T00:00:00Z`
  );
  const effectiveStart =
    requestedStart < oldestSupported
      ? oldestSupported
      : requestedStart;
  const effectiveStartString =
    effectiveStart.toISOString().slice(0, 10);
  const categoryQuery = CATEGORY_QUERIES[category];
  const combinedQuery = [
    `(${categoryQuery})`,
    query ? `(${query})` : "",
  ]
    .filter(Boolean)
    .join(" AND ");
  const params = new URLSearchParams({
    query: combinedQuery,
    mode: "artlist",
    maxrecords: "75",
    format: "json",
    sort: "DateDesc",
    startdatetime: toGdeltDate(
      effectiveStartString
    ),
    enddatetime: toGdeltDate(end, true),
  });

  const response = await fetch(
    `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 900 },
    }
  );

  if (!response.ok) {
    throw new Error("GDELT request failed.");
  }

  const data = await response.json();
  const rawArticles = Array.isArray(data.articles)
    ? data.articles
    : [];
  const allArticles: NewsArticle[] = rawArticles
    .map((item: Record<string, unknown>) => {
      const url = String(item.url || "");
      const title = cleanText(item.title);
      const domain = String(item.domain || "");
      const sourceName =
        publisherNameFromDomain(domain) ||
        "News publisher";

      return {
        id: stableId(url || title),
        title,
        summary: `A recent report from ${sourceName}. Open the story for the publisher's complete coverage and latest updates.`,
        imageUrl:
          String(item.socialimage || "") ||
          undefined,
        sourceName,
        sourceUrl: domain
          ? `https://${domain}`
          : undefined,
        url,
        publishedAt: parseGdeltDate(
          String(item.seendate || "")
        ),
        category,
        language:
          String(item.language || "") ||
          undefined,
        country:
          String(item.sourcecountry || "") ||
          undefined,
        provider: "gdelt" as const,
      };
    })
    .filter(
      (article: NewsArticle) =>
        article.title &&
        article.url &&
        article.url.startsWith("http")
    );

  const unique = Array.from(
    new Map(
      allArticles.map((article) => [
        article.url,
        article,
      ])
    ).values()
  );
  const pageNumber = Math.max(
    1,
    Number(page || "1") || 1
  );
  const pageSize = 18;
  const startIndex = (pageNumber - 1) * pageSize;
  const pageArticles = unique.slice(
    startIndex,
    startIndex + pageSize
  );
  const enriched = await Promise.all(
    pageArticles.map((article, index) =>
      index < 8
        ? enrichGdeltArticle(article)
        : Promise.resolve(article)
    )
  );
  const hasMore =
    startIndex + pageSize < unique.length;

  return {
    articles: enriched,
    nextPage: hasMore ? pageNumber + 1 : null,
    provider: "GDELT",
    notice:
      requestedStart < oldestSupported
        ? "The no-key feed was limited to the most recent year."
        : "Publisher summaries are used when available; open the original source for the full report.",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = parseCategory(
    searchParams.get("category")
  );
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";
  const query = cleanText(
    searchParams.get("q") || ""
  ).slice(0, 180);
  const page = searchParams.get("page");

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end)
  ) {
    return NextResponse.json(
      {
        error:
          "A valid start and end date are required.",
      },
      { status: 400 }
    );
  }

  if (new Date(start) > new Date(end)) {
    return NextResponse.json(
      {
        error:
          "The start date must be before the end date.",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEWSDATA_API_KEY;
  let primaryError = "";

  if (apiKey) {
    try {
      const result = await fetchNewsData({
        apiKey,
        category,
        start,
        end,
        query,
        page,
      });

      if (result.articles.length > 0) {
        return NextResponse.json(result);
      }
    } catch (error) {
      primaryError =
        error instanceof Error
          ? error.message
          : "NewsData request failed.";
    }
  }

  try {
    const fallback = await fetchGdelt({
      category,
      start,
      end,
      query,
      page,
    });

    return NextResponse.json({
      ...fallback,
      notice: [
        primaryError
          ? `Primary provider unavailable: ${primaryError}`
          : "",
        fallback.notice,
      ]
        .filter(Boolean)
        .join(" "),
    });
  } catch (fallbackError) {
    return NextResponse.json(
      {
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : "Unable to load news.",
      },
      { status: 502 }
    );
  }
}
