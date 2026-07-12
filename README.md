# 3D Hub

A Next.js app for searching and streaming YouTube content, with accounts, playlists, and watch history — focused on Telugu/Tollywood movies and music, plus dedicated 3D video and immersive audio sections.

## Features

- 🔍 Search any movie, show, or music video (powered by the YouTube Data API)
- 🎬 **Movies** and 🎵 **Music** sections, defaulting to Tollywood content
- 🕶️ **3D Videos** — genuine 3D/stereoscopic content via YouTube's official 3D filter
- 🎧 **Immersive Audio** — music mixed by creators for Dolby Atmos / 8D / surround sound
- 👤 Accounts via email/password or Google sign-in (Firebase Auth)
- 📁 Custom **playlists** — save videos into as many named playlists as you like
- 🕒 **Watch history**, tracked separately per section
- 🔑 Forgot-password flow
- 📱 Responsive layout — sidebar collapses to a horizontal bar on mobile

## Tech stack

- **Next.js** (App Router) + TypeScript
- **Firebase** — Authentication (email/password + Google) and Firestore (playlists, history)
- **YouTube Data API v3** — search and video metadata, proxied through a server-side API route so the key is never exposed to the browser

## Project structure

```
app/
  page.tsx              Home — search + featured hero banner
  movies/               Movies section
  music/                Music section
  3d-videos/            3D video section
  immersive-audio/      Immersive/surround audio section
  login/, signup/       Auth pages
  forgot-password/      Password reset
  playlists/            Playlist list + [id] detail view
  history/              Watch history, tabbed by section
  profile/              Account hub
  api/youtube/          Server-side YouTube search proxy
components/
  Navbar.tsx            Top horizontal nav
  Sidebar.tsx           Left sidebar (Playlists, History)
  Hero.tsx              Home page featured banner
  VideoCard.tsx          Video thumbnail + save-to-playlist button
  PlaylistPicker.tsx     Modal for adding a video to playlists
  VideoPlayer.tsx        Embedded YouTube player modal
  AuthProvider.tsx       Auth state context
  SearchBar.tsx          Reusable search input
lib/
  firebase.ts            Firebase initialization
  history.ts             Watch history logging helper
```

## Setup

See [SETUP.md](./SETUP.md) for step-by-step instructions on creating the Firebase project, getting a YouTube API key, and setting environment variables.

## Important notes

- Videos play via YouTube's official embedded player. There's no offline download feature — downloading YouTube content violates YouTube's Terms of Service. Instead, save videos to playlists to replay them anytime through the site.
- The "Immersive Audio" section surfaces content already mixed by creators for Dolby Atmos/8D/surround — this app does not itself apply any audio processing.

## Running locally

```
npm install
npm run dev
```

Visit http://localhost:3000

## 3D Hub v2 update

This package includes:
- Premium responsive dark UI and animated hero
- Mobile-safe search and horizontally scrollable navigation
- Modern video cards with Favorites and Watch Later controls
- Local My Library page (`/library`) with Favorites, Watch Later and Recently Played
- Full-page responsive video player with fullscreen landscape support
- Music and Immersive Audio mini player with seek controls
- Mini player hidden on Home, Movies, Kids and 3D Videos
- AI search and recommendation support retained
- SEO metadata, sitemap, robots and structured data retained
- Optional Google Analytics through `NEXT_PUBLIC_GA_MEASUREMENT_ID`

Favorites and Watch Later are stored in browser local storage. Existing signed-in playlists and history continue using Firebase.
