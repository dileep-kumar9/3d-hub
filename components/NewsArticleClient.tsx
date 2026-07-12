"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import NewsAudioPlayer, {
  type NewsSpeechRequest,
} from "./NewsAudioPlayer";
import {
  NEWS_CATEGORY_LABELS,
  addNewsHistory,
  buildNewsSections,
  estimateReadingMinutes,
  formatNewsDate,
  getCachedNewsArticle,
  isNewsBookmarked,
  quickNewsPoints,
  toggleNewsBookmark,
  type NewsArticle,
} from "@/lib/news";

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    let videoId = "";

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    } else if (
      parsed.hostname.includes("youtube.com")
    ) {
      videoId =
        parsed.searchParams.get("v") ||
        parsed.pathname
          .split("/")
          .filter(Boolean)
          .pop() ||
        "";
    }

    return videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export default function NewsArticleClient() {
  const params = useParams<{ id: string }>();
  const articleId = decodeURIComponent(
    String(params?.id || "")
  );
  const contentRef =
    useRef<HTMLDivElement | null>(null);

  const [article, setArticle] =
    useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] =
    useState(false);
  const [selectedText, setSelectedText] =
    useState("");
  const [speechRequest, setSpeechRequest] =
    useState<NewsSpeechRequest | null>(null);
  const [view, setView] = useState<
    "quick" | "detailed"
  >("detailed");

  useEffect(() => {
    document.body.classList.add(
      "news-route-active"
    );

    const cached = getCachedNewsArticle(articleId);

    if (cached) {
      setArticle(cached);
      setBookmarked(
        isNewsBookmarked(cached.id)
      );
      addNewsHistory(cached);
    }

    setLoading(false);

    return () => {
      document.body.classList.remove(
        "news-route-active"
      );
      window.speechSynthesis?.cancel();
    };
  }, [articleId]);

  const sections = useMemo(
    () => (article ? buildNewsSections(article) : []),
    [article]
  );
  const quickPoints = useMemo(
    () => (article ? quickNewsPoints(article) : []),
    [article]
  );
  const youtubeEmbed = useMemo(
    () =>
      article?.videoUrl
        ? getYouTubeEmbedUrl(article.videoUrl)
        : null,
    [article?.videoUrl]
  );

  function speak(
    label: string,
    text: string
  ) {
    if (!text.trim()) return;

    setSpeechRequest({
      id: `${Date.now()}-${Math.random()}`,
      label,
      text,
    });
  }

  function updateSelection() {
    const selection = window.getSelection();
    const text = selection
      ?.toString()
      .replace(/\s+/g, " ")
      .trim();

    if (!text || text.length < 2) {
      setSelectedText("");
      return;
    }

    const container = contentRef.current;
    const range = selection?.rangeCount
      ? selection.getRangeAt(0)
      : null;

    if (
      !container ||
      !range ||
      !container.contains(
        range.commonAncestorContainer
      )
    ) {
      setSelectedText("");
      return;
    }

    setSelectedText(text.slice(0, 5000));
  }

  function toggleBookmark() {
    if (!article) return;
    const next = toggleNewsBookmark(article);
    setBookmarked(next);
  }

  if (loading) {
    return (
      <section className="news-shell news-article-shell">
        <div className="news-article-status">
          Loading story…
        </div>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="news-shell news-article-shell">
        <div className="news-article-status">
          <span>📰</span>
          <h1>Story not available in this tab</h1>
          <p>
            Open this story from the News page first so
            its publisher details and summary can be
            stored safely in your browser.
          </p>
          <Link href="/news">Return to News</Link>
        </div>
      </section>
    );
  }

  const fullNarration = [
    article.title,
    ...sections.map(
      (section) =>
        `${section.title}. ${section.text}`
    ),
  ].join(". ");

  return (
    <section className="news-shell news-article-shell">
      <div className="news-article-toolbar">
        <Link href="/news">← Back to News</Link>

        <div>
          <button
            type="button"
            onClick={() =>
              speak("Full article", fullNarration)
            }
          >
            🔊 Listen to article
          </button>
          <button
            type="button"
            className={
              bookmarked ? "active" : ""
            }
            onClick={toggleBookmark}
          >
            {bookmarked ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <article className="news-article">
        <header className="news-article-header">
          <div className="news-article-category">
            {
              NEWS_CATEGORY_LABELS[
                article.category
              ]
            }
          </div>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>

          <div className="news-article-meta">
            <strong>{article.sourceName}</strong>
            <time>
              {formatNewsDate(article.publishedAt)}
            </time>
            <span>
              {estimateReadingMinutes(article)} min read
            </span>
          </div>
        </header>

        {article.imageUrl && (
          <img
            className="news-article-main-image"
            src={article.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
          />
        )}

        <div className="news-article-view-tabs">
          <button
            type="button"
            className={
              view === "quick" ? "active" : ""
            }
            onClick={() => setView("quick")}
          >
            Quick summary
          </button>
          <button
            type="button"
            className={
              view === "detailed" ? "active" : ""
            }
            onClick={() => setView("detailed")}
          >
            Detailed summary
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
          >
            Original source ↗
          </a>
        </div>

        <div
          ref={contentRef}
          className="news-article-body"
          onMouseUp={updateSelection}
          onTouchEnd={() =>
            window.setTimeout(
              updateSelection,
              120
            )
          }
        >
          {view === "quick" ? (
            <section className="news-quick-summary">
              <div className="news-section-heading">
                <h2>Quick summary</h2>
                <button
                  type="button"
                  onClick={() =>
                    speak(
                      "Quick summary",
                      quickPoints.join(". ")
                    )
                  }
                >
                  🔊 Listen
                </button>
              </div>

              <ul>
                {quickPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ) : (
            sections.map((section) => (
              <section
                className="news-text-section"
                key={section.id}
              >
                <div className="news-section-heading">
                  <h2>{section.title}</h2>
                  <button
                    type="button"
                    onClick={() =>
                      speak(
                        section.title,
                        section.text
                      )
                    }
                  >
                    🔊 Listen to section
                  </button>
                </div>
                <p>{section.text}</p>
              </section>
            ))
          )}
        </div>

        {article.videoUrl && (
          <section className="news-related-media">
            <h2>Related video</h2>

            {youtubeEmbed ? (
              <div className="news-video-frame">
                <iframe
                  src={youtubeEmbed}
                  title={`Related video: ${article.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                src={article.videoUrl}
                controls
                preload="metadata"
              />
            )}
          </section>
        )}

        <footer className="news-source-box">
          <div>
            <span>Publisher</span>
            <strong>{article.sourceName}</strong>
          </div>
          <p>
            3D Hub displays a concise summary and media
            metadata. Read the publisher&apos;s original
            report for the complete article and updates.
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
          >
            Open original article ↗
          </a>
        </footer>
      </article>

      {selectedText && (
        <button
          type="button"
          className="news-selection-listen"
          onClick={() =>
            speak("Selected text", selectedText)
          }
        >
          🔊 Listen to selected text
        </button>
      )}

      <NewsAudioPlayer
        request={speechRequest}
        onClose={() => setSpeechRequest(null)}
      />
    </section>
  );
}
