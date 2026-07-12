"use client";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import VideoCard,{Video} from "@/components/VideoCard";
import TrendingRow from "@/components/TrendingRow";
import { useAuth } from "@/components/AuthProvider";
import { logHistory } from "@/lib/history";
import { useInfiniteVideos } from "@/lib/useInfiniteVideos";
import { useNowPlaying } from "@/components/NowPlayingProvider";
import { pickDailyQuery } from "@/lib/dailyQuery";
import { RefreshIcon } from "@/components/Icons";
const defaultQueries=["Telugu top music hits 2026","Telugu new songs 2026","Tollywood melody songs","Telugu item songs","Telugu romantic love songs"];
export default function Music(){
  const {user}=useAuth();
  const {play}=useNowPlaying();
  const [refreshing,setRefreshing]=useState(false);
  const {videos,loading,search,reload,loadMore,hasMore}=useInfiniteVideos(pickDailyQuery(defaultQueries));
  const handlePlay=(video:Video)=>{play(video);logHistory(user,video,"music")};
  async function handleRefresh(){setRefreshing(true);try{await reload();}finally{setRefreshing(false);}}
  return <div className="page-wrap">
    <div className="page-header"><span className="eyebrow">Listen while browsing</span><h1>Music</h1><p>Tap a song to start the bottom mini player. Seek to any time and continue browsing.</p></div>
    <div className="content-search-row">
      <div className="content-search-box"><SearchBar section="music" onSearch={search} placeholder="Search music or ask AI..."/></div>
      <button className={`refresh-btn${refreshing?" spinning":""}`} onClick={handleRefresh} disabled={refreshing} title="Refresh content" aria-label="Refresh content"><RefreshIcon size={20}/><span className="refresh-label">Refresh</span></button>
    </div>
    <TrendingRow title="🔥 Trending Music" section="music" onPlay={handlePlay}/>
    <div className="video-grid">{videos.map(v=><VideoCard key={v.id} video={v} section="music" onPlay={handlePlay}/>)}</div>
    {loading&&<p style={{textAlign:"center",color:"#94a3b8"}}>Loading...</p>}
    {!loading&&hasMore&&<button className="load-more-btn" onClick={loadMore}>Load More</button>}
  </div>
}
