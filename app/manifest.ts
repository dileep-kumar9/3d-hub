import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "3D Hub",
    short_name: "3D Hub",
    description:
      "Telugu movies, music, news, Shorts, kids videos, 3D content and immersive audio.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#05070d",
    theme_color: "#7c3aed",
    orientation: "any",
    categories: [
      "entertainment",
      "music",
      "video",
      "news",
    ],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48 64x64 128x128 256x256",
        type: "image/x-icon",
      },
    ],
  };
}
