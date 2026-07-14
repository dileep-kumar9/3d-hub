"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useNowPlaying } from "./NowPlayingProvider";

const SECTIONS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/music", label: "Music" },
  { href: "/kids", label: "Kids" },
  { href: "/3d-videos", label: "3D Videos" },
  { href: "/immersive-audio", label: "Immersive Audio" },
];

function isAudioVideo(section?: string, mediaType?: string) {
  const normalizedSection = (section || "").toLowerCase();

  return (
    mediaType === "music" ||
    mediaType === "audio" ||
    normalizedSection === "music" ||
    normalizedSection === "immersive audio" ||
    normalizedSection === "immersive-audio"
  );
}

export default function MobileSectionSwitcher() {
  const pathname = usePathname();
  const { nowPlaying } = useNowPlaying();
  const [open, setOpen] = useState(false);

  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.href === pathname),
    [pathname]
  );

  const hasMusicMiniPlayer = Boolean(
    nowPlaying && isAudioVideo(nowPlaying.section, nowPlaying.mediaType)
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!activeSection) {
    return null;
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="mobile-section-backdrop"
          aria-label="Close section menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`mobile-section-switcher${
          hasMusicMiniPlayer ? " above-mini-player" : ""
        }${open ? " open" : ""}`}
      >
        {open && (
          <nav className="mobile-section-menu" aria-label="Change section">
            <div className="mobile-section-menu-header">
              <strong>Change section</strong>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close section menu"
              >
                ✕
              </button>
            </div>

            <div className="mobile-section-menu-grid">
              {SECTIONS.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className={pathname === section.href ? "active" : ""}
                  aria-current={pathname === section.href ? "page" : undefined}
                >
                  {section.label}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <button
          type="button"
          className="mobile-section-trigger"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label="Change content section"
        >
          <span className="mobile-section-trigger-icon" aria-hidden="true">
            ☰
          </span>
          <span>{activeSection.label}</span>
          <small>Change</small>
        </button>
      </div>
    </>
  );
}
