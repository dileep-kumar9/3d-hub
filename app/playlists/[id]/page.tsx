"use client";
import { useEffect,useState } from "react";
import { useParams,useRouter } from "next/navigation";
import { deleteField,doc,onSnapshot,updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import VideoCard,{Video} from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import { PlaylistIcon } from "@/components/Icons";
export default function PlaylistDetail(){const {user,loading}=useAuth();const router=useRouter();const id=useParams().id as string;const [name,setName]=useState("");const [videos,setVideos]=useState<Video[]>([]);const [fetching,setFetching]=useState(true);const [playing,setPlaying]=useState<Video|null>(null);useEffect(()=>{if(!loading&&!user)router.push("/login")},[loading,user,router]);useEffect(()=>{if(!user)return;return onSnapshot(doc(db,"users",user.uid,"playlists",id),s=>{if(s.exists()){setName(s.data().name||"Playlist");setVideos(Object.values(s.data().videos||{}))}setFetching(false)})},[user,id]);async function remove(v:Video){if(!user)return;await updateDoc(doc(db,"users",user.uid,"playlists",id),{[`videos.${v.id}`]:deleteField()})}if(loading||fetching)return <p className="page-message">Loading playlist...</p>;return <main className="collection-page"><div className="collection-heading"><PlaylistIcon size={48}/><div><h1>{name}</h1><p>{videos.length} saved item{videos.length===1?"":"s"}</p></div></div>{videos.length?<div className="video-grid">{videos.map(v=><div key={v.id} className="playlist-video-wrap"><VideoCard video={v} section={v.section} onPlay={setPlaying}/><button className="remove-from-playlist" onClick={()=>remove(v)}>Remove from playlist</button></div>)}</div>:<div className="empty-state"><h2>This playlist is empty</h2></div>}<VideoPlayer video={playing} onClose={()=>setPlaying(null)}/></main>}
