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
    title: "News",
    description:
      "Browse Google News headlines by a required time period and one selected category.",
    url: "https://3d-hub-lac.vercel.app/news",
    type: "website",
  },
};

export default function NewsPage() {
  return <NewsPageClient />;
}
