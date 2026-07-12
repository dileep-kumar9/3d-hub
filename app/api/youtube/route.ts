import { NextRequest, NextResponse } from "next/server";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10))
    );
}

function parseIsoDuration(duration = "PT0S") {
  const match = duration.match(
    /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );

  if (!match) return 0;

  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] =
    match;

  return (
    Number(days) * 86400 +
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds)
  );
}

const FALLBACK_VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    title: "Content temporarily unavailable — try again shortly",
    channel: "3D Hub",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  },
];

type YouTubeItem = {
  id?: string | { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      maxres?: { url?: string };
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
};

function mapVideo(item: YouTubeItem) {
  const id =
    typeof item.id === "string"
      ? item.id
      : item.id?.videoId;

  return {
    id: id || "",
    title: decodeHtmlEntities(item.snippet?.title || "Untitled video"),
    channel: decodeHtmlEntities(
      item.snippet?.channelTitle || "YouTube"
    ),
    thumbnail:
      item.snippet?.thumbnails?.maxres?.url ||
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : ""),
    publishedAt: item.snippet?.publishedAt,
    viewCount: Number(item.statistics?.viewCount || 0),
    durationSeconds: parseIsoDuration(
      item.contentDetails?.duration
    ),
  };
}

async function youtubeFetch(
  url: string,
  forceRefresh: boolean,
  trending = false
) {
  return forceRefresh
    ? fetch(url, { cache: "no-store" })
    : fetch(url, {
        next: {
          revalidate: trending ? 1800 : 21600,
        },
      });
}

async function getPopularChart({
  apiKey,
  categoryId,
  maxResults = 24,
  pageToken,
  forceRefresh,
}: {
  apiKey: string;
  categoryId?: string;
  maxResults?: number;
  pageToken?: string | null;
  forceRefresh: boolean;
}) {
  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    chart: "mostPopular",
    regionCode: "IN",
    maxResults: String(maxResults),
    key: apiKey,
  });

  if (categoryId) {
    params.set("videoCategoryId", categoryId);
  }

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await youtubeFetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`,
    forceRefresh,
    true
  );
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message || "YouTube trending request failed."
    );
  }

  return data as {
    items?: YouTubeItem[];
    nextPageToken?: string;
  };
}

async function getRecentPopularSearch({
  apiKey,
  query,
  dimension,
  duration,
  days = 180,
  maxResults = 24,
  pageToken,
  forceRefresh,
}: {
  apiKey: string;
  query: string;
  dimension?: string | null;
  duration?: string | null;
  days?: number;
  maxResults?: number;
  pageToken?: string | null;
  forceRefresh: boolean;
}) {
  const publishedAfter = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: String(maxResults),
    q: query,
    order: "viewCount",
    regionCode: "IN",
    relevanceLanguage: "te",
    publishedAfter,
    safeSearch: "moderate",
    key: apiKey,
  });

  if (dimension === "3d") {
    params.set("videoDimension", "3d");
  }

  if (duration === "short") {
    params.set("videoDuration", "short");
  }

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await youtubeFetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
    forceRefresh,
    true
  );
  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message || "YouTube trending search failed."
    );
  }

  return data as {
    items?: YouTubeItem[];
    nextPageToken?: string;
  };
}

const YOUTUBE_SHORTS_CATEGORY_FEEDS: Record<
  string,
  { query: string; order: "date" | "relevance" | "viewCount" }
> = {
  comedy: {
    query: "Telugu comedy #shorts|Telugu funny #shorts|Telugu meme #shorts",
    order: "relevance",
  },
  music: {
    query: "Telugu music #shorts|Telugu songs #shorts|Tollywood songs #shorts",
    order: "date",
  },
  movies: {
    query: "Telugu movie #shorts|Tollywood scenes #shorts|Telugu cinema #shorts",
    order: "date",
  },
  dance: {
    query: "Telugu dance #shorts|Tollywood dance #shorts|Telugu reels dance",
    order: "relevance",
  },
  kids: {
    query: "Telugu kids #shorts|Telugu children #shorts|Telugu rhymes #shorts",
    order: "relevance",
  },
  animation: {
    query: "Telugu animation #shorts|Telugu cartoon #shorts|3D animation #shorts",
    order: "relevance",
  },
  gaming: {
    query: "Telugu gaming #shorts|Telugu gamer #shorts|India gaming #shorts",
    order: "date",
  },
  facts: {
    query: "Telugu facts #shorts|Telugu knowledge #shorts|Telugu quiz #shorts",
    order: "relevance",
  },
  food: {
    query: "Telugu food #shorts|Telugu street food #shorts|Andhra food #shorts",
    order: "date",
  },
  travel: {
    query: "Telugu travel #shorts|Andhra travel #shorts|Telangana travel #shorts",
    order: "date",
  },
  tech: {
    query: "Telugu tech #shorts|Telugu technology #shorts|Telugu gadgets #shorts",
    order: "date",
  },
  vlog: {
    query: "Telugu vlog #shorts|Telugu daily vlog #shorts|Telugu creators #shorts",
    order: "date",
  },
  devotional: {
    query: "Telugu devotional #shorts|Telugu bhakti #shorts|Telugu temple #shorts",
    order: "relevance",
  },
  motivation: {
    query: "Telugu motivation #shorts|Telugu inspirational #shorts|Telugu success #shorts",
    order: "relevance",
  },
  education: {
    query: "Telugu education #shorts|Telugu learning #shorts|Telugu study #shorts",
    order: "relevance",
  },
  sports: {
    query: "Telugu sports #shorts|Telugu cricket #shorts|India sports #shorts",
    order: "date",
  },
  culture: {
    query: "Telugu culture #shorts|Telugu festival #shorts|Andhra culture #shorts",
    order: "relevance",
  },
  cooking: {
    query: "Telugu cooking #shorts|Telugu recipes #shorts|Andhra recipes #shorts",
    order: "date",
  },
  science: {
    query: "Telugu science #shorts|Telugu experiments #shorts|Telugu space #shorts",
    order: "relevance",
  },
  fitness: {
    query: "Telugu fitness #shorts|Telugu workout #shorts|Telugu health #shorts",
    order: "date",
  },
  nature: {
    query: "Telugu nature #shorts|Telugu wildlife #shorts|Andhra nature #shorts",
    order: "date",
  },
  art: {
    query: "Telugu art #shorts|Telugu craft #shorts|Telugu drawing #shorts",
    order: "relevance",
  },
  lifestyle: {
    query: "Telugu lifestyle #shorts|Telugu daily #shorts|Telugu fashion #shorts",
    order: "date",
  },
  entertainment: {
    query: "Telugu entertainment #shorts|Telugu viral #shorts|India Telugu #shorts",
    order: "viewCount",
  },
};

const YOUTUBE_SHORTS_FEEDS = [
  {
    query:
      "Telugu comedy #shorts|Telugu music #shorts|Telugu movie #shorts|Telugu dance #shorts",
    order: "relevance",
  },
  {
    query:
      "Telugu kids #shorts|Telugu animation #shorts|Telugu gaming #shorts|Telugu facts #shorts",
    order: "relevance",
  },
  {
    query:
      "Telugu food #shorts|Telugu travel #shorts|Telugu tech #shorts|Telugu vlog #shorts",
    order: "date",
  },
  {
    query:
      "Telugu devotional #shorts|Telugu motivation #shorts|Telugu education #shorts|Telugu sports #shorts",
    order: "relevance",
  },
  {
    query:
      "Tollywood scenes #shorts|Telugu funny #shorts|Telugu songs #shorts|Telugu creators #shorts",
    order: "date",
  },
  {
    query:
      "Andhra Pradesh #shorts|Telangana #shorts|Telugu culture #shorts|Telugu festival #shorts",
    order: "relevance",
  },
  {
    query:
      "Telugu cooking #shorts|Telugu recipes #shorts|Telugu street food #shorts|Telugu village #shorts",
    order: "date",
  },
  {
    query:
      "Telugu science #shorts|Telugu knowledge #shorts|Telugu history #shorts|Telugu quiz #shorts",
    order: "relevance",
  },
  {
    query:
      "Telugu cricket #shorts|Telugu fitness #shorts|Telugu outdoor #shorts|Telugu adventure #shorts",
    order: "date",
  },
  {
    query:
      "Telugu pets #shorts|Telugu nature #shorts|Telugu art #shorts|Telugu craft #shorts",
    order: "relevance",
  },
  {
    query:
      "Telugu viral #shorts|India #shorts Telugu|Telugu entertainment #shorts|Telugu meme #shorts",
    order: "viewCount",
  },
  {
    query:
      "Telugu latest #shorts|Telugu new creators #shorts|Telugu daily #shorts|Telugu lifestyle #shorts",
    order: "date",
  },
] as const;

function classifyShortsCategory(
  item: YouTubeItem
): string {
  const text = [
    item.snippet?.title || "",
    item.snippet?.description || "",
  ]
    .join(" ")
    .toLowerCase();

  const rules: Array<[string, RegExp]> = [
    ["comedy", /comedy|funny|meme|joke|సరదా|హాస్య/],
    ["music", /music|song| పాట|lyric|audio|సాంగ్/],
    ["movies", /movie|cinema|film|tollywood|scene|trailer/],
    ["dance", /dance|choreography|step|నృత్య/],
    ["kids", /kids|children|rhymes|nursery|baby|పిల్ల/],
    ["animation", /animation|cartoon|animated|3d animation/],
    ["gaming", /gaming|gameplay|gamer|pubg|free fire|minecraft/],
    ["facts", /facts?|quiz|knowledge|did you know|తెలుసా/],
    ["food", /food|street food|restaurant|tasting/],
    ["cooking", /cooking|recipe|kitchen|cook/],
    ["travel", /travel|trip|tour|place|destination|journey/],
    ["tech", /tech|technology|gadget|mobile|phone|ai |software/],
    ["vlog", /vlog|daily life|creator/],
    ["devotional", /devotional|bhakti|temple|god|puja|దేవ/],
    ["motivation", /motivation|inspiration|success|quote/],
    ["education", /education|study|learning|exam|school|college/],
    ["sports", /sports|cricket|football|kabaddi|match/],
    ["culture", /culture|festival|tradition|village|సంక్రాంతి/],
    ["science", /science|experiment|space|physics|chemistry/],
    ["fitness", /fitness|workout|gym|exercise|health/],
    ["nature", /nature|wildlife|animal|forest|bird|pet/],
    ["art", /art|drawing|painting|craft|design/],
    ["lifestyle", /lifestyle|fashion|beauty|style|routine/],
  ];

  for (const [category, pattern] of rules) {
    if (pattern.test(text)) {
      return category;
    }
  }

  return "entertainment";
}

async function getYouTubeShorts({
  apiKey,
  pageToken,
  forceRefresh,
  mix,
  category,
}: {
  apiKey: string;
  pageToken?: string | null;
  forceRefresh: boolean;
  mix?: string | null;
  category?: string | null;
}) {
  const parsedMix = Number.parseInt(
    mix || "0",
    10
  );
  const mixIndex =
    Number.isFinite(parsedMix)
      ? Math.abs(parsedMix) %
        YOUTUBE_SHORTS_FEEDS.length
      : 0;
  const categoryFeed =
    category
      ? YOUTUBE_SHORTS_CATEGORY_FEEDS[
          category
        ]
      : undefined;
  const selectedFeed =
    categoryFeed ||
    YOUTUBE_SHORTS_FEEDS[mixIndex];
  const shortsQuery =
    selectedFeed.query;
  const shortsOrder =
    selectedFeed.order;
  const publishedAfter = new Date(
    Date.now() -
      365 * 24 * 60 * 60 * 1000
  ).toISOString();

  const searchParams = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: "30",
    q: shortsQuery,
    order: shortsOrder,
    regionCode: "IN",
    relevanceLanguage: "te",
    publishedAfter,
    safeSearch: "moderate",
    videoDuration: "short",
    videoEmbeddable: "true",
    key: apiKey,
  });

  if (pageToken) {
    searchParams.set(
      "pageToken",
      pageToken
    );
  }

  const searchResponse =
    await youtubeFetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`,
      forceRefresh,
      true
    );
  const searchData =
    await searchResponse.json();

  if (
    !searchResponse.ok ||
    searchData.error
  ) {
    throw new Error(
      searchData.error?.message ||
        "YouTube Shorts request failed."
    );
  }

  const searchItems: YouTubeItem[] =
    searchData.items || [];
  const ids = searchItems
    .map((item) =>
      typeof item.id === "string"
        ? item.id
        : item.id?.videoId
    )
    .filter(
      (id): id is string =>
        Boolean(id)
    );

  if (ids.length === 0) {
    return {
      items: [],
      nextPageToken:
        searchData.nextPageToken,
    };
  }

  const detailParams =
    new URLSearchParams({
      part:
        "snippet,contentDetails,statistics",
      id: ids.join(","),
      key: apiKey,
    });

  const detailResponse =
    await youtubeFetch(
      `https://www.googleapis.com/youtube/v3/videos?${detailParams.toString()}`,
      forceRefresh,
      true
    );
  const detailData =
    await detailResponse.json();

  if (
    !detailResponse.ok ||
    detailData.error
  ) {
    throw new Error(
      detailData.error?.message ||
        "YouTube Shorts details request failed."
    );
  }

  const details: YouTubeItem[] =
    detailData.items || [];

  // YouTube Shorts can be up to three minutes. The Data API's
  // videoDuration=short filter means "under four minutes", so apply
  // the stricter three-minute Shorts limit here.
  const shortsLengthItems =
    details.filter((item) => {
      const seconds = parseIsoDuration(
        item.contentDetails?.duration
      );

      return (
        seconds > 0 &&
        seconds <= 180
      );
    });

  const markedAsShorts =
    shortsLengthItems.filter((item) => {
      const searchableText = [
        item.snippet?.title || "",
        item.snippet?.description || "",
      ].join(" ");

      return /#shorts?\b|youtube\s*shorts?\b/i.test(
        searchableText
      );
    });

  return {
    items:
      markedAsShorts.length >= 5
        ? markedAsShorts
        : shortsLengthItems,
    nextPageToken:
      searchData.nextPageToken,
  };
}

async function getTrendingVideos(
  section: string,
  apiKey: string,
  pageToken: string | null,
  forceRefresh: boolean
) {
  if (section === "movies") {
    return getPopularChart({
      apiKey,
      categoryId: "1",
      pageToken,
      forceRefresh,
    });
  }

  if (section === "music") {
    return getPopularChart({
      apiKey,
      categoryId: "10",
      pageToken,
      forceRefresh,
    });
  }

  if (section === "kids") {
    const [animation, education] = await Promise.all([
      getPopularChart({
        apiKey,
        categoryId: "1",
        maxResults: 20,
        forceRefresh,
      }),
      getPopularChart({
        apiKey,
        categoryId: "27",
        maxResults: 20,
        forceRefresh,
      }),
    ]);

    const combined = [
      ...(animation.items || []),
      ...(education.items || []),
    ];
    const kidsTerms =
      /kids?|children|cartoon|animation|rhymes?|nursery|learn|school|baby|చిన్నార|పిల్ల|బాల|కార్టూన్/i;
    const filtered = combined.filter((item) =>
      kidsTerms.test(item.snippet?.title || "")
    );

    return {
      items: (filtered.length >= 8 ? filtered : combined).slice(0, 24),
      nextPageToken: undefined,
    };
  }

  if (section === "shorts") {
    return getYouTubeShorts({
      apiKey,
      pageToken,
      forceRefresh,
      mix: null,
      category: null,
    });
  }

  if (section === "3d") {
    return getRecentPopularSearch({
      apiKey,
      query:
        "3D SBS video|VR 3D video|360 3D video|3D animation",
      dimension: "3d",
      days: 365,
      pageToken,
      forceRefresh,
    });
  }

  if (section === "immersive-audio") {
    return getRecentPopularSearch({
      apiKey,
      query:
        "Telugu Dolby Atmos|Telugu 8D audio|Telugu spatial audio|Telugu surround sound",
      days: 240,
      pageToken,
      forceRefresh,
    });
  }

  return getPopularChart({
    apiKey,
    pageToken,
    forceRefresh,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const mode = searchParams.get("mode");
  const section = searchParams.get("section") || "home";
  const dimension = searchParams.get("dimension");
  const duration = searchParams.get("duration");
  const pageToken = searchParams.get("pageToken");
  const forceRefresh = searchParams.has("refresh");
  const shortsMix = searchParams.get("mix");
  const shortsCategory =
    searchParams.get("category");
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      videos: FALLBACK_VIDEOS,
      isFallback: true,
    });
  }

  try {
    if (mode === "shorts") {
      const data =
        await getYouTubeShorts({
          apiKey,
          pageToken,
          forceRefresh,
          mix: shortsMix,
          category: shortsCategory,
        });

      const videos = (
        data.items || []
      )
        .map((item) => ({
          ...mapVideo(item),
          shortsCategory:
            shortsCategory ||
            classifyShortsCategory(item),
        }))
        .filter(
          (video) =>
            video.id &&
            video.thumbnail &&
            video.durationSeconds > 0 &&
            video.durationSeconds <= 180
        );

      return NextResponse.json({
        videos,
        nextPageToken:
          data.nextPageToken || null,
        source: "youtube-shorts",
      });
    }

    if (mode === "trending") {
      const data = await getTrendingVideos(
        section,
        apiKey,
        pageToken,
        forceRefresh
      );

      const videos = (data.items || [])
        .map(mapVideo)
        .filter((video) => video.id && video.thumbnail);

      return NextResponse.json({
        videos,
        nextPageToken: data.nextPageToken || null,
        source: "youtube-trending",
      });
    }

    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: "16",
      q,
      key: apiKey,
    });

    if (dimension === "3d") {
      params.set("videoDimension", "3d");
    }
    if (duration === "short") {
      params.set("videoDuration", "short");
    }
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await youtubeFetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      forceRefresh,
      false
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      return NextResponse.json({
        videos: FALLBACK_VIDEOS,
        isFallback: true,
        error:
          data.error?.message ||
          "YouTube request failed.",
      });
    }

    const videos = (data.items || [])
      .map(mapVideo)
      .filter((video: ReturnType<typeof mapVideo>) =>
        Boolean(video.id && video.thumbnail)
      );

    return NextResponse.json({
      videos,
      nextPageToken: data.nextPageToken || null,
    });
  } catch (error) {
    console.error("YouTube API request failed:", error);
    return NextResponse.json({
      videos: FALLBACK_VIDEOS,
      isFallback: true,
    });
  }
}
