"use client";

import { ReactNode } from "react";
import { Video } from "./VideoCard";

type Props = {
  video: Video;
  children?: ReactNode;
};

export default function Hero({
  video,
  children,
}: Props) {
  const backdrop = video.thumbnail.replace(
    "/mqdefault",
    "/hqdefault"
  );

  return (
    <section className="hero-section">
      <div
        className="hero-background"
        style={{
          backgroundImage: `url(${backdrop})`,
        }}
      />

      <div className="hero-overlay" />

      <div className="hero-search">
        {children}
      </div>
    </section>
  );
}
