"use client";
import { useState } from "react";
import { useLibrary } from "@/components/LibraryProvider";
import VideoCard,{Video} from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import { HeartIcon } from "@/components/Icons";
export default function LikedPage(){const {favorites,loading}=useLibrary();const [playing,setPlaying]=useState<Video|null>(null);return <main className="collection-page"><div className="collection-heading"><HeartIcon size={46} filled/><div><h1>Liked</h1><p>Your liked movies, music, kids videos, 3D videos and immersive audio.</p></div></div>{loading?<p className="page-message">Loading liked items...</p>:favorites.length?<div className="video-grid">{favorites.map(v=><VideoCard key={v.id} video={v} section={v.section} onPlay={setPlaying}/>)}</div>:<div className="empty-state"><h2>No liked items yet</h2><p>Tap Like on any card and it will be saved here.</p></div>}<VideoPlayer video={playing} onClose={()=>setPlaying(null)}/></main>}
