ibrary
/
Navbar.tsx


"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useSidebar } from "./SidebarProvider";
import { LogoIcon, MenuIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user } = useAuth();
  const { toggle } = useSidebar();

  return (
    <header className="main-navbar">
      <div className="navbar-top-row">
        <div className="navbar-left">
          <button
            type="button"
            onClick={toggle}
            className="hamburger-btn"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <MenuIcon />
          </button>

          <Link href="/" className="navbar-logo" aria-label="3D Hub home">
            <LogoIcon size={46} />
            <span className="brand-name">
              <span className="brand-3d">3D</span>
              <span className="brand-hub">HUB</span>
            </span>
          </Link>
        </div>

        <div className="navbar-account">
          <ThemeToggle />

          {user ? (
            <>
              <span className="navbar-email">{user.email}</span>
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="logout-button"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="login-link">
                Log in
              </Link>
              <Link href="/signup" className="signup-button">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="top-links" aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/shorts">Shorts</Link>
        <Link href="/movies">Movies</Link>
        <Link href="/music">Music</Link>
        <Link href="/kids">Kids</Link>
        <Link href="/3d-videos">3D Videos</Link>
        <Link href="/immersive-audio">Immersive Audio</Link>
        <Link href="/news">News</Link>
        <Link href="/library">Library</Link>
      </nav>
    </header>
  );
}
