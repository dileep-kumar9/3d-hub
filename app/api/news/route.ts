import {
  NextRequest,
  NextResponse,
} from "next/server";

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
  top: "India latest news",
  local:
    '"Andhra Pradesh" OR Telangana OR Hyderabad OR Telugu',
  india: "India",
  world: "world OR international",
  technology:
    "technology OR artificial intelligence OR software OR gadgets",
  business:
    "business OR economy OR markets OR companies",
  sports:
    "sports OR cricket OR football OR badminton",
  entertainment:
    "entertainment OR Telugu cinema OR movies OR television",
  health:
    "health OR medicine OR hospital OR wellness",
};

function parseCategory(
  value: string | null
): NewsCategory | null {
  if (
    value &&
    NEWS_CATEGORIES.includes(
      value as NewsCategory
    )
  ) {
    return value as NewsCategory;
  }

  return null;
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

function decodeXml(value: string) {
  return value
    .replace(
      /<!\[CDATA\[([\s\S]*?)\]\]>/g,
      "$1"
    )
    .replace(
      /&#(\d+);/g,
      (_, number: string) =>
        String.fromCodePoint(
          Number(number)
        )
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, number: string) =>
        String.fromCodePoint(
          Number.parseInt(number, 16)
        )
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractXmlTag(
  value: string,
  tag: string
) {
  const escaped = tag.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  const match = value.match(
    new RegExp(
      `<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`,
      "i"
    )
  );

  return cleanText(
    decodeXml(match?.[1] || "")
  );
}

function extractXmlAttribute(
  value: string,
  tag: string,
  attribute: string
) {
  const escapedTag = tag.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  const escapedAttribute =
    attribute.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  const match = value.match(
    new RegExp(
      `<${escapedTag}[^>]*\\s${escapedAttribute}=["']([^"']+)["'][^>]*>`,
      "i"
    )
  );

  return cleanText(
    decodeXml(match?.[1] || "")
  );
}

function extractImageFromItem(
  item: string
) {
  const direct =
    extractXmlAttribute(
      item,
      "media:content",
      "url"
    ) ||
    extractXmlAttribute(
      item,
      "media:thumbnail",
      "url"
    ) ||
    extractXmlAttribute(
      item,
      "enclosure",
      "url"
    );

  if (direct.startsWith("http")) {
    return direct;
  }

  const decoded = decodeXml(item);
  const imageMatch = decoded.match(
    /<img[^>]+src=["']([^"']+)["']/i
  );
  const image = cleanText(
    imageMatch?.[1] || ""
  );

  return image.startsWith("http")
    ? image
    : "";
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
    decodeXml(
      html.match(first)?.[1] ||
        html.match(second)?.[1] ||
        ""
    )
  );
}

function stableId(value: string) {
  let hash = 2166136261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `news-${(hash >>> 0).toString(36)}`;
}

function addDays(
  value: string,
  numberOfDays: number
) {
  const date = new Date(
    `${value}T12:00:00Z`
  );
  date.setUTCDate(
    date.getUTCDate() + numberOfDays
  );

  return date.toISOString().slice(0, 10);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 9000
) {
  const controller =
    new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function enrichGoogleArticle(
  article: NewsArticle
) {
  if (article.imageUrl) {
    return article;
  }

  try {
    const response =
      await fetchWithTimeout(
        article.url,
        {
          headers: {
            Accept:
              "text/html,application/xhtml+xml",
            "User-Agent":
              "Mozilla/5.0 (compatible; 3DHubNewsReader/1.0; +https://3d-hub-lac.vercel.app/news)",
          },
          redirect: "follow",
          cache: "no-store",
        },
        3200
      );

    if (!response.ok) {
      return article;
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType.includes("text/html")
    ) {
      return article;
    }

    const html = (
      await response.text()
    ).slice(0, 350_000);
    const image =
      extractMeta(
        html,
        "og:image",
        "property"
      ) ||
      extractMeta(
        html,
        "twitter:image",
        "name"
      );
    const description =
      extractMeta(
        html,
        "og:description",
        "property"
      ) ||
      extractMeta(
        html,
        "description",
        "name"
      );
    const finalUrl =
      response.url.startsWith("http")
        ? response.url
        : article.url;

    return {
      ...article,
      url: finalUrl,
      imageUrl:
        image.startsWith("http")
          ? image
          : article.imageUrl,
      summary:
        description.length >
        article.summary.length
          ? description.slice(0, 700)
          : article.summary,
    };
  } catch {
    return article;
  }
}

async function fetchGoogleNews({
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
  const categoryQuery =
    CATEGORY_QUERIES[category];
  const combinedQuery = [
    `(${categoryQuery})`,
    query ? `(${query})` : "",
    `after:${addDays(start, -1)}`,
    `before:${addDays(end, 1)}`,
  ]
    .filter(Boolean)
    .join(" ");

  const params = new URLSearchParams({
    q: combinedQuery,
    hl: "en-IN",
    gl: "IN",
    ceid: "IN:en",
  });

  const response =
    await fetchWithTimeout(
      `https://news.google.com/rss/search?${params.toString()}`,
      {
        headers: {
          Accept:
            "application/rss+xml, application/xml, text/xml",
          "User-Agent":
            "Mozilla/5.0 (compatible; 3DHubNewsReader/1.0; +https://3d-hub-lac.vercel.app/news)",
        },
        cache: "no-store",
      },
      9000
    );

  if (!response.ok) {
    throw new Error(
      `Google News returned ${response.status}.`
    );
  }

  const xml = await response.text();
  const itemBlocks =
    xml.match(
      /<item\b[\s\S]*?<\/item>/gi
    ) || [];

  const rangeStart = new Date(
    `${start}T00:00:00Z`
  ).getTime();
  const rangeEnd = new Date(
    `${end}T23:59:59Z`
  ).getTime();

  const parsed: NewsArticle[] =
    itemBlocks
      .map((item) => {
        const rawTitle =
          extractXmlTag(item, "title");
        const sourceName =
          extractXmlTag(
            item,
            "source"
          ) || "News publisher";
        const sourceUrl =
          extractXmlAttribute(
            item,
            "source",
            "url"
          ) || undefined;
        const url =
          extractXmlTag(item, "link");
        const publishedAtRaw =
          extractXmlTag(
            item,
            "pubDate"
          );
        const publishedDate =
          new Date(publishedAtRaw);
        const publishedAt =
          Number.isNaN(
            publishedDate.getTime()
          )
            ? new Date().toISOString()
            : publishedDate.toISOString();
        const rawDescription =
          extractXmlTag(
            item,
            "description"
          );
        const sourceSuffix =
          sourceName &&
          rawTitle.endsWith(
            ` - ${sourceName}`
          )
            ? ` - ${sourceName}`
            : "";
        const title = sourceSuffix
          ? rawTitle.slice(
              0,
              -sourceSuffix.length
            )
          : rawTitle;
        const imageUrl =
          extractImageFromItem(item);

        return {
          id: stableId(
            extractXmlTag(item, "guid") ||
              url ||
              `${title}-${publishedAt}`
          ),
          title,
          summary:
            rawDescription &&
            rawDescription !== rawTitle &&
            rawDescription.length >
              title.length
              ? rawDescription.slice(0, 700)
              : `Coverage from ${sourceName}. Open the story for the publisher's complete report.`,
          imageUrl:
            imageUrl || undefined,
          sourceName,
          sourceUrl,
          url,
          publishedAt,
          category,
          language: "English",
          country:
            category === "world"
              ? undefined
              : "India",
        } satisfies NewsArticle;
      })
      .filter((article) => {
        if (
          !article.title ||
          !article.url ||
          !article.url.startsWith(
            "http"
          )
        ) {
          return false;
        }

        const timestamp = new Date(
          article.publishedAt
        ).getTime();

        return (
          Number.isFinite(timestamp) &&
          timestamp >= rangeStart &&
          timestamp <= rangeEnd
        );
      });

  const unique = Array.from(
    new Map(
      parsed.map((article) => [
        `${article.title.toLowerCase()}|${article.sourceName.toLowerCase()}`,
        article,
      ])
    ).values()
  );

  const pageNumber = Math.max(
    1,
    Number(page || "1") || 1
  );
  const pageSize = 20;
  const startIndex =
    (pageNumber - 1) * pageSize;
  const pageArticles = unique.slice(
    startIndex,
    startIndex + pageSize
  );
  const enriched =
    await Promise.all(
      pageArticles.map(
        (article, index) =>
          index < 8
            ? enrichGoogleArticle(
                article
              )
            : Promise.resolve(
                article
              )
      )
    );
  const hasMore =
    startIndex + pageSize <
    unique.length;

  return {
    articles: enriched,
    nextPage:
      hasMore
        ? pageNumber + 1
        : null,
    provider: "Google News",
    notice:
      "Headlines are supplied through Google News with publisher attribution. Open each story for the original publisher's complete coverage.",
  };
}

export async function GET(
  request: NextRequest
) {
  const { searchParams } =
    request.nextUrl;
  const category = parseCategory(
    searchParams.get("category")
  );
  const start =
    searchParams.get("start") || "";
  const end =
    searchParams.get("end") || "";
  const query = cleanText(
    searchParams.get("q") || ""
  ).slice(0, 180);
  const page =
    searchParams.get("page");

  if (!category) {
    return NextResponse.json(
      {
        error:
          "Exactly one valid category is required.",
      },
      { status: 400 }
    );
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      start
    ) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      end
    )
  ) {
    return NextResponse.json(
      {
        error:
          "A valid time period is required.",
      },
      { status: 400 }
    );
  }

  if (
    new Date(start) >
    new Date(end)
  ) {
    return NextResponse.json(
      {
        error:
          "The start date must be before the end date.",
      },
      { status: 400 }
    );
  }

  try {
    const result =
      await fetchGoogleNews({
        category,
        start,
        end,
        query,
        page,
      });

    return NextResponse.json(
      result
    );
  } catch (error) {
    return NextResponse.json(
      {
        articles: [],
        nextPage: null,
        provider: "Google News",
        notice:
          error instanceof Error
            ? `Google News is temporarily unavailable: ${error.message}`
            : "Google News is temporarily unavailable.",
      }
    );
  }
}
