"use client";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import VideoCard,{Video} from "@/components/VideoCard";
import TrendingRow from "@/components/TrendingRow";
import VideoPlayer from "@/components/VideoPlayer";
import { useAuth } from "@/components/AuthProvider";
import { logHistory } from "@/lib/history";
import { useInfiniteVideos } from "@/lib/useInfiniteVideos";
import { pickDailyQuery } from "@/lib/dailyQuery";
import { RefreshIcon } from "@/components/Icons";
const defaultQueries=["3D SBS movie","3D animation short film","3D nature documentary","3D action trailer"];
export default function ThreeDVideos(){
  const {user}=useAuth();
  const [playing,setPlaying]=useState<Video|null>(null);
  const [refreshing,setRefreshing]=useState(false);
  const {videos,loading,search,reload,loadMore,hasMore}=useInfiniteVideos(pickDailyQuery(defaultQueries),"dimension=3d");
  const handlePlay=(video:Video)=>{setPlaying(video);logHistory(user,video,"3d videos")};
  async function handleRefresh(){setRefreshing(true);try{await reload();}finally{setRefreshing(false);}}
  return <div className="page-wrap">
    <div className="page-header"><span className="eyebrow">Depth and immersion</span><h1>3D Videos</h1><p>3D-format content best viewed with compatible displays or glasses.</p></div>
    <div className="content-search-row">
      <div className="content-search-box"><SearchBar section="3d" onSearch={search} placeholder="Search 3D videos or ask AI..."/></div>
      <button className={`refresh-btn${refreshing?" spinning":""}`} onClick={handleRefresh} disabled={refreshing} title="Refresh content" aria-label="Refresh content"><RefreshIcon size={20}/><span className="refresh-label">Refresh</span></button>
    </div>
    <TrendingRow title="🔥 Trending 3D Videos" section="3d" onPlay={handlePlay}/>
    {loading&&<p style={{padding:"0 24px",color:"#94a3b8"}}>Loading...</p>}
    {!loading&&videos.length===0&&<p style={{padding:"0 24px",color:"#94a3b8"}}>No 3D videos found for that search — try another term.</p>}
    <div className="video-grid">{videos.map(v=><VideoCard key={v.id} video={v} section="3d videos" onPlay={handlePlay}/>)}</div>
    {!loading&&hasMore&&<button className="load-more-btn" onClick={loadMore}>Load More</button>}
    <VideoPlayer video={playing} onClose={()=>setPlaying(null)}/>
  </div>
}
