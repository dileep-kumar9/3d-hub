"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useLibrary } from "./LibraryProvider";
import PlaylistPicker from "./PlaylistPicker";
import { HeartIcon, LaterIcon, PlayIcon, PlaylistIcon } from "./Icons";

export type Video = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  section?: string;
  mediaType?: "video" | "music" | "audio";
  searchHistoryId?: string;
  searchQuery?: string;
  searchSection?: string;
};
type Props = { video: Video; onPlay: (video: Video) => void; section?: string };

export default function VideoCard({ video, onPlay, section }: Props) {
  const { user } = useAuth();
  const library = useLibrary();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState<"like" | "later" | null>(null);
  const item: Video = { ...video, section: section || video.section || "home", mediaType: section === "music" ? "music" : section === "immersive audio" ? "audio" : video.mediaType || "video" };

  async function action(e: React.MouseEvent, kind: "like" | "later") {
    e.stopPropagation();
    if (!user) { window.location.href = "/login"; return; }
    try { setBusy(kind); if (kind === "like") await library.toggleFavorite(item); else await library.toggleWatchLater(item); }
    finally { setBusy(null); }
  }
  function savePlaylist(e: React.MouseEvent) { e.stopPropagation(); if (!user) { window.location.href = "/login"; return; } setPickerOpen(true); }

  return <>
    <article className="video-card" onClick={() => { library.addRecent(item); onPlay(item); }}>
      <div className="video-card-image-wrap">
        <img src={item.thumbnail} alt={item.title} className="video-card-image" loading="lazy" />
        <div className="video-card-overlay"><span className="video-card-play"><PlayIcon size={25}/></span></div>
        <span className="video-card-badge">HD</span>
      </div>
      <div className="video-card-body">
        <h3>{item.title}</h3><p>{item.channel}</p>
        <div className="video-card-actions media-actions">
          <button className={library.isFavorite(item.id) ? "active" : ""} onClick={e => action(e,"like")} title="Like">
            <HeartIcon size={19} filled={library.isFavorite(item.id)}/><span>{busy==="like"?"Saving...":library.isFavorite(item.id)?"Liked":"Like"}</span>
          </button>
          <button className={library.isWatchLater(item.id) ? "active" : ""} onClick={e => action(e,"later")} title="Watch later">
            <LaterIcon size={19} filled={library.isWatchLater(item.id)}/><span>{busy==="later"?"Saving...":library.isWatchLater(item.id)?"Saved":"Watch Later"}</span>
          </button>
          <button onClick={savePlaylist} title="Add to playlist"><PlaylistIcon size={19}/><span>Add to Playlist</span></button>
        </div>
      </div>
    </article>
    {pickerOpen && <PlaylistPicker video={item} onClose={() => setPickerOpen(false)} />}
  </>;
}
