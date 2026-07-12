"use client";
import VideoCard, { Video } from "./VideoCard";

export default function ContentRow({ title, videos, onPlay }: { title: string; videos: Video[]; onPlay: (video: Video) => void }) {
  if (!videos.length) return null;
  return <section className="content-section">
    <div className="section-heading"><h2>{title}</h2><span>{videos.length} titles</span></div>
    <div className="content-row">{videos.map((video) => <div className="content-row-item" key={`${title}-${video.id}`}><VideoCard video={video} onPlay={onPlay} /></div>)}</div>
  </section>;
}
