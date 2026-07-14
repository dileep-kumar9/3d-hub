import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

import { AuthProvider } from "@/components/AuthProvider";
import { NowPlayingProvider } from "@/components/NowPlayingProvider";
import { SidebarProvider } from "@/components/SidebarProvider";
import { LibraryProvider } from "@/components/LibraryProvider";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import MusicMiniPlayer from "@/components/MusicMiniPlayer";
import MobileSectionSwitcher from "@/components/MobileSectionSwitcher";
import Analytics from "@/components/Analytics";

const siteUrl = "https://3d-hub-lac.vercel.app/";

const themeInitializationScript = `
  (function () {
    try {
      var savedTheme =
        localStorage.getItem("3d-hub-theme");
      var theme =
        savedTheme === "light" ||
        savedTheme === "dark"
          ? savedTheme
          : window.matchMedia(
              "(prefers-color-scheme: light)"
            ).matches
            ? "light"
            : "dark";

      document.documentElement.dataset.theme =
        theme;
      document.documentElement.style.colorScheme =
        theme;
    } catch (error) {
      document.documentElement.dataset.theme =
        "dark";
      document.documentElement.style.colorScheme =
        "dark";
    }
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "3D Hub — Watch Telugu Movies & Music Free",
    template: "%s | 3D Hub",
  },

  description:
    "Discover Telugu movies, Tollywood trailers, music, kids videos, Shorts, 3D content and immersive audio on 3D Hub.",

  applicationName: "3D Hub",
  manifest: "/manifest.webmanifest",

  keywords: [
    "3D Hub",
    "3D Hub Telugu",
    "Telugu movies",
    "Telugu music",
    "Tollywood",
    "YouTube Shorts",
    "3D videos",
    "kids videos",
    "immersive audio",
  ],

  icons: {
    icon: [
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },

  alternates: {
    canonical: siteUrl,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  openGraph: {
    title: "3D Hub",
    description:
      "Telugu movies, music, Shorts, kids videos, 3D content and immersive audio.",
    url: siteUrl,
    siteName: "3D Hub",
    type: "website",
    locale: "en_IN",
  },

  twitter: {
    card: "summary",
    title: "3D Hub",
    description: "Telugu entertainment in one place.",
  },

  appleWebApp: {
    capable: true,
    title: "3D Hub",
    statusBarStyle: "black-translucent",
  },

  category: "entertainment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * Google uses this WebSite structured data as the strongest site-name
   * preference. The vercel.app subdomain is included only as the final
   * fallback, so Google can use it instead of the generic host name
   * "Vercel" when it does not select the preferred 3D Hub name.
   */
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: "3D Hub",
    alternateName: [
      "3DHub",
      "3D Hub Telugu",
      "3d-hub-lac.vercel.app",
    ],
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "3D Hub",
      alternateName: "3DHub",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}favicon.ico`,
      },
    },
  };

  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <meta
          name="theme-color"
          content="#000000"
        />

        <script
          dangerouslySetInnerHTML={{
            __html:
              themeInitializationScript,
          }}
        />
      </head>

      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              websiteStructuredData
            ).replace(/</g, "\\u003c"),
          }}
        />

        <Analytics />

        <AuthProvider>
          <NowPlayingProvider>
            <LibraryProvider>
              <SidebarProvider>
                <div className="app-shell">
                  <Sidebar />

                  <div className="main-area">
                    <Navbar />

                    <main className="site-main">
                      {children}
                    </main>

                    <footer className="site-footer">
                      <p>
                        © {new Date().getFullYear()} 3D Hub.
                        All rights reserved.
                      </p>

                      <div>
                        <Link href="/privacy">
                          Privacy Policy
                        </Link>
                        <Link href="/terms">
                          Terms of Service
                        </Link>
                      </div>
                    </footer>
                  </div>
                </div>

                <MobileSectionSwitcher />
                <MusicMiniPlayer />
              </SidebarProvider>
            </LibraryProvider>
          </NowPlayingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
