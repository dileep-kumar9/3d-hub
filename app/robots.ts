import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    "https://3d-hub-lac.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/profile",
        "/history",
        "/playlists",
      ],
    },

    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
