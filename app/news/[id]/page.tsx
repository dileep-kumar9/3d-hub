import type { Metadata } from "next";

import NewsArticleClient from "@/components/NewsArticleClient";

export const metadata: Metadata = {
  title: "News Story",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NewsArticlePage() {
  return <NewsArticleClient />;
}
