"use client";
import { useState } from "react";
import { useLibrary } from "@/components/LibraryProvider";
import VideoCard,{Video} from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import { LaterIcon } from "@/components/Icons";
export default function WatchLaterPage(){const {watchLater,loading}=useLibrary();const [playing,setPlaying]=useState<Video|null>(null);return <main className="collection-page"><div className="collection-heading"><LaterIcon size={46}/><div><h1>Watch Later</h1><p>Items you saved to watch or listen to later.</p></div></div>{loading?<p className="page-message">Loading saved items...</p>:watchLater.length?<div className="video-grid">{watchLater.map(v=><VideoCard key={v.id} video={v} section={v.section} onPlay={setPlaying}/>)}</div>:<div className="empty-state"><h2>Nothing saved yet</h2><p>Tap Watch Later on any card to save it here.</p></div>}<VideoPlayer video={playing} onClose={()=>setPlaying(null)}/></main>}
