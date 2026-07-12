import type { Metadata } from "next";
import NewsOpenChoice from "@/components/NewsOpenChoice";

export const metadata: Metadata = {
  title: "News",
  description: "Open Google News India.",
};

export default function NewsPage() {
  return <NewsOpenChoice />;
}
