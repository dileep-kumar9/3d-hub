"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import VideoCard,{Video} from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import { HeadphonesIcon, HeartIcon, HistoryIcon, LaterIcon, MusicIcon } from "@/components/Icons";
import { useNowPlaying } from "@/components/NowPlayingProvider";

type SectionKey="home"|"movies"|"music"|"kids"|"3d videos"|"immersive audio";
const sections:{key:SectionKey;label:string;icon?:React.ReactNode}[]=[{key:"home",label:"Home"},{key:"movies",label:"Movies"},{key:"music",label:"Music",icon:<MusicIcon size={18}/>},{key:"kids",label:"Kids"},{key:"3d videos",label:"3D Videos"},{key:"immersive audio",label:"Immersive Audio",icon:<HeadphonesIcon size={18}/>}];
export default function HistoryPage(){const {user,loading}=useAuth();const router=useRouter();const {play}=useNowPlaying();const [tab,setTab]=useState<SectionKey>("movies");const [videos,setVideos]=useState<Video[]>([]);const [fetching,setFetching]=useState(true);const [error,setError]=useState("");const [playing,setPlaying]=useState<Video|null>(null);
 function handlePlay(video:Video){if(tab==="music"||tab==="immersive audio"){play(video);}else{setPlaying(video);}}
 useEffect(()=>{if(!loading&&!user)router.replace("/login")},[loading,user,router]);
 useEffect(()=>{if(!user){setFetching(false);return}setFetching(true);setError("");const q=query(collection(db,"users",user.uid,"history",tab,"items"),orderBy("watchedAt","desc"));return onSnapshot(q,s=>{setVideos(s.docs.map(d=>({...d.data() as Video,id:(d.data().id as string)||d.id,section:tab,mediaType:tab==="music"?"music":tab==="immersive audio"?"audio":"video"})));setFetching(false)},e=>{console.error(e);setError(e.code==="permission-denied"?"Firestore permission denied. Update your Firestore rules.":"History could not be loaded.");setFetching(false)})},[user,tab]);
 if(loading)return <p className="page-message">Checking your account...</p>;if(!user)return <p className="page-message">Redirecting...</p>;
 return <main className="history-page"><div className="history-heading"><div className="history-title-icon"><HistoryIcon size={54}/></div><div><h1>Watch History</h1><p>Videos and audio you've opened across all sections.</p></div><div className="history-shortcuts"><Link href="/liked"><HeartIcon/>Liked</Link><Link href="/watch-later"><LaterIcon/>Watch Later</Link></div></div>
 <div className="history-tabs">{sections.map(s=><button key={s.key} className={tab===s.key?"active":""} onClick={()=>setTab(s.key)}>{s.icon}{s.label}</button>)}</div>
 {fetching?<p className="page-message">Loading history...</p>:error?<div className="error-panel">{error}</div>:videos.length?<div className="video-grid history-grid">{videos.map(v=><VideoCard key={v.id} video={v} section={tab} onPlay={handlePlay}/>)}</div>:<div className="empty-state"><h2>No history in {sections.find(s=>s.key===tab)?.label}</h2><p>Open content in this section and it will appear here.</p></div>}
 <VideoPlayer video={playing} onClose={()=>setPlaying(null)}/></main>}
