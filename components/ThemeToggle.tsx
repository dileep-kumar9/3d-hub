"use client";

import {
  useEffect,
  useState,
} from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "3d-hub-theme";

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5a8.6 8.6 0 1 0 10.6 10.6Z" />
    </svg>
  );
}

function readCurrentTheme(): Theme {
  return document.documentElement.dataset.theme ===
    "light"
    ? "light"
    : "dark";
}

function updateBrowserTheme(theme: Theme) {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeColor = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeColor) {
    themeColor.setAttribute(
      "content",
      theme === "light"
        ? "#f8fafc"
        : "#000000"
    );
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] =
    useState<Theme>("dark");

  useEffect(() => {
    setTheme(readCurrentTheme());
  }, []);

  function toggleTheme() {
    const nextTheme: Theme =
      readCurrentTheme() === "dark"
        ? "light"
        : "dark";

    document.documentElement.classList.add(
      "theme-is-changing"
    );

    updateBrowserTheme(nextTheme);
    localStorage.setItem(
      STORAGE_KEY,
      nextTheme
    );
    setTheme(nextTheme);

    window.setTimeout(() => {
      document.documentElement.classList.remove(
        "theme-is-changing"
      );
    }, 260);
  }

  const switchingTo =
    theme === "dark"
      ? "light"
      : "dark";

  return (
    <button
      type="button"
      className="theme-toggle-button"
      onClick={toggleTheme}
      aria-label={`Switch to ${switchingTo} mode`}
      title={`Switch to ${switchingTo} mode`}
      aria-pressed={theme === "light"}
    >
      <span className="theme-icon theme-icon-sun">
        <SunIcon />
      </span>

      <span className="theme-icon theme-icon-moon">
        <MoonIcon />
      </span>

      <span className="sr-only">
        {theme === "dark"
          ? "Light mode"
          : "Dark mode"}
      </span>
    </button>
  );
}
