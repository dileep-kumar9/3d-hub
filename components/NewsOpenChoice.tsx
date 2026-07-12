"use client";

import Link from "next/link";

const GOOGLE_NEWS_URL =
  "https://news.google.com/home?hl=en-IN&gl=IN&ceid=IN:en";

export default function NewsOpenChoice() {
  function openInNewTab() {
    window.open(
      GOOGLE_NEWS_URL,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function continueInSameTab() {
    window.location.assign(GOOGLE_NEWS_URL);
  }

  return (
    <main className="news-open-choice-page">
      <section className="news-open-choice-card">
        <div
          className="news-open-choice-icon"
          aria-hidden="true"
        >
          📰
        </div>

        <h1>Open Google News</h1>

        <p>
          Choose how you want to continue.
        </p>

        <div className="news-open-choice-actions">
          <button
            type="button"
            className="news-open-choice-primary"
            onClick={openInNewTab}
          >
            Open in new tab
          </button>

          <button
            type="button"
            className="news-open-choice-secondary"
            onClick={continueInSameTab}
          >
            Continue in same tab
          </button>
        </div>

        <Link
          href="/"
          className="news-open-choice-back"
        >
          Back to 3D Hub
        </Link>
      </section>

      <style jsx>{`
        .news-open-choice-page {
          min-height: calc(100dvh - 76px);
          display: grid;
          place-items: center;
          padding: 24px;
          background: #000;
        }

        .news-open-choice-card {
          width: min(430px, 100%);
          padding: 32px;
          border: 1px solid
            rgba(255, 255, 255, 0.12);
          border-radius: 22px;
          background: #111;
          box-shadow:
            0 24px 70px
            rgba(0, 0, 0, 0.45);
          text-align: center;
        }

        .news-open-choice-icon {
          width: 68px;
          height: 68px;
          display: grid;
          place-items: center;
          margin: 0 auto;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #2563eb
            );
          font-size: 31px;
        }

        h1 {
          margin: 20px 0 0;
          color: #fff;
          font-size: 28px;
          line-height: 1.15;
        }

        p {
          margin: 10px 0 0;
          color: #a3a3a3;
          font-size: 14px;
        }

        .news-open-choice-actions {
          display: grid;
          gap: 11px;
          margin-top: 26px;
        }

        button {
          width: 100%;
          min-height: 48px;
          padding: 10px 16px;
          border-radius: 13px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        button:hover {
          transform: translateY(-1px);
        }

        .news-open-choice-primary {
          border: 0;
          color: #fff;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #2563eb
            );
        }

        .news-open-choice-secondary {
          border: 1px solid
            rgba(255, 255, 255, 0.18);
          color: #fff;
          background: #1a1a1a;
        }

        .news-open-choice-secondary:hover {
          border-color:
            rgba(255, 255, 255, 0.42);
          background: #222;
        }

        .news-open-choice-back {
          display: inline-block;
          margin-top: 21px;
          color: #a78bfa;
          font-size: 12px;
          text-decoration: none;
        }

        .news-open-choice-back:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .news-open-choice-page {
            min-height:
              calc(100dvh - 64px);
            padding: 16px;
          }

          .news-open-choice-card {
            padding: 25px 18px;
            border-radius: 18px;
          }

          h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </main>
  );
}
