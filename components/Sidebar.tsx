"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import { useSidebar } from "./SidebarProvider";
import {
  CloseIcon,
  LibraryIcon,
  PlaylistIcon,
  ProfileIcon,
  SettingsIcon,
} from "./Icons";

type Playlist = { id: string; name: string; section: string; count: number };

const SECTION_LABELS: Record<string, string> = {
  home: "Home",
  movies: "Movies",
  music: "Music",
  kids: "Kids",
  "3d videos": "3D Videos",
  "immersive audio": "Immersive Audio",
};

export default function Sidebar() {
  const { user } = useAuth();
  const { open, close } = useSidebar();
  const pathname = usePathname();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setPlaylists([]);
      return;
    }

    return onSnapshot(collection(db, "users", user.uid, "playlists"), (snap) => {
      setPlaylists(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || "Untitled playlist",
          section: d.data().section || "home",
          count: Object.keys(d.data().videos || {}).length,
        }))
      );
    });
  }, [user]);

  const item = (href: string, label: string, icon: React.ReactNode) => (
    <Link
      href={href}
      onClick={close}
      className={`sidebar-link ${pathname === href ? "active" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );

  const sectionOrder = [
    "movies",
    "music",
    "kids",
    "3d videos",
    "immersive audio",
    "home",
  ];
  const grouped = sectionOrder
    .map((section) => ({
      section,
      items: playlists.filter((playlist) => playlist.section === section),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={close} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button className="sidebar-close" onClick={close} aria-label="Close sidebar">
          <CloseIcon />
        </button>
        <p className="sidebar-title">Your Library</p>

        {!user ? (
          <>
            <nav className="sidebar-nav">
              {item("/library", "Library", <LibraryIcon />)}
            </nav>
            <p className="sidebar-login-copy">
              <Link href="/login" onClick={close}>
                Log in
              </Link>{" "}
              to access your playlists, profile and settings.
            </p>
          </>
        ) : (
          <>
            <nav className="sidebar-nav">
              {item("/library", "Library", <LibraryIcon />)}

              <button
                type="button"
                className="sidebar-link sidebar-dropdown-toggle"
                onClick={() => setDropdownOpen((current) => !current)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <PlaylistIcon />
                  <span>Playlists</span>
                </span>
                <span className={`sidebar-dropdown-arrow${dropdownOpen ? " open" : ""}`}>
                  ▾
                </span>
              </button>

              {dropdownOpen && (
                <div>
                  {grouped.length === 0 && (
                    <p style={{ padding: "6px 14px", color: "#94a3b8", fontSize: 12 }}>
                      No playlists yet — add a video to one from any section.
                    </p>
                  )}

                  {grouped.map((group) => (
                    <div key={group.section} className="sidebar-dropdown-group">
                      <p className="sidebar-dropdown-group-label">
                        {SECTION_LABELS[group.section] || group.section}
                      </p>
                      {group.items.map((playlist) => (
                        <Link
                          key={playlist.id}
                          href={`/playlists/${playlist.id}`}
                          onClick={close}
                          className="sidebar-link"
                        >
                          <span style={{ paddingLeft: 4 }}>{playlist.name}</span>
                          <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 12 }}>
                            {playlist.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ))}

                  <Link
                    href="/playlists"
                    onClick={close}
                    className="sidebar-link"
                    style={{ color: "#67e8f9" }}
                  >
                    <span style={{ paddingLeft: 4 }}>View all playlists →</span>
                  </Link>
                </div>
              )}
            </nav>

            <div className="sidebar-bottom">
              {item("/profile", "Profile", <ProfileIcon />)}
              {item("/settings", "Settings", <SettingsIcon />)}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
