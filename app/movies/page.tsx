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
const defaultQueries=["Telugu full movie 2026","Tollywood new movie trailer","Telugu blockbuster action movie","Telugu movies 2026 full HD","Tollywood suspense thriller movie"];
export default function Movies(){
  const {user}=useAuth();
  const [playing,setPlaying]=useState<Video|null>(null);
  const [refreshing,setRefreshing]=useState(false);
  const {videos,loading,search,reload,loadMore,hasMore}=useInfiniteVideos(pickDailyQuery(defaultQueries));
  const handlePlay=(video:Video)=>{setPlaying(video);logHistory(user,video,"movies")};
  async function handleRefresh(){setRefreshing(true);try{await reload();}finally{setRefreshing(false);}}
  return <div className="page-wrap">
    <div className="page-header"><span className="eyebrow">3D Hub collection</span><h1>Movies</h1><p>Telugu movies, trailers and Tollywood entertainment.</p></div>
    <div className="content-search-row">
      <div className="content-search-box"><SearchBar section="movies" onSearch={search} placeholder="Search movies or ask AI..."/></div>
      <button className={`refresh-btn${refreshing?" spinning":""}`} onClick={handleRefresh} disabled={refreshing} title="Refresh content" aria-label="Refresh content"><RefreshIcon size={20}/><span className="refresh-label">Refresh</span></button>
    </div>
    <TrendingRow title="🔥 Trending Movies" section="movies" onPlay={handlePlay}/>
    <div className="video-grid">{videos.map(v=><VideoCard key={v.id} video={v} section="movies" onPlay={handlePlay}/>)}</div>
    {loading&&<p style={{textAlign:"center",color:"#94a3b8"}}>Loading...</p>}
    {!loading&&hasMore&&<button className="load-more-btn" onClick={loadMore}>Load More</button>}
    <VideoPlayer video={playing} onClose={()=>setPlaying(null)}/>
  </div>
}
