"use client";

import { useEffect, useState } from "react";

export const POLICY_CONSENT_KEY = "3dhub:policy-consent:v1";
export const POLICY_CONSENT_EVENT = "3dhub-policy-consent";

export default function PolicyConsent() {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    try {
      setAccepted(localStorage.getItem(POLICY_CONSENT_KEY) === "accepted");
    } finally {
      setReady(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(POLICY_CONSENT_KEY, "accepted");
    setAccepted(true);
    window.dispatchEvent(new Event(POLICY_CONSENT_EVENT));
  }

  if (!ready || accepted) return null;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "grid",
        placeItems: "center",
        padding: 18,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(8px)",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-consent-title"
        style={{
          width: "min(560px, 100%)",
          padding: 24,
          borderRadius: 18,
          border: "1px solid var(--line-strong)",
          background: "var(--surface)",
          color: "var(--text)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 id="policy-consent-title" style={{ marginTop: 0 }}>
          Before you continue
        </h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.65 }}>
          3D Hub uses YouTube API Services, Firebase, browser storage, and
          optional analytics. Review the policies and accept them before using
          the website.
        </p>
        <p style={{ lineHeight: 1.65 }}>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--cyan)" }}
          >
            Privacy Policy
          </a>{" "}
          ·{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--cyan)" }}
          >
            Terms of Service
          </a>{" "}
          ·{" "}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--cyan)" }}
          >
            YouTube Terms
          </a>
        </p>
        <button
          type="button"
          onClick={accept}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "12px 16px",
            border: 0,
            borderRadius: 12,
            cursor: "pointer",
            background: "var(--purple)",
            color: "white",
            fontWeight: 700,
          }}
        >
          Accept and continue
        </button>
      </section>
    </div>
  );
}
