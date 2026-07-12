import type { Metadata } from "next";

import NewsPageClient from "@/components/NewsPageClient";

export const metadata: Metadata = {
  title: "News",
  description:
    "Browse news by day, week, month, year, or custom date range, with text summaries, images, related media, bookmarks, and selectable text-to-speech.",
  alternates: {
    canonical:
      "https://3d-hub-lac.vercel.app/news",
  },
  openGraph: {
    title: "3D Hub News",
    description:
      "A timeline-first news reader with summaries, images, related media, and text-to-speech.",
    url: "https://3d-hub-lac.vercel.app/news",
    type: "website",
  },
};

export default function NewsPage() {
  return <NewsPageClient />;
}
