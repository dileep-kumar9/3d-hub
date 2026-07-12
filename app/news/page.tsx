import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "News",
  description: "Open Google News India.",
};

export default function NewsPage() {
  redirect(
    "https://news.google.com/home?hl=en-IN&gl=IN&ceid=IN:en"
  );
}
