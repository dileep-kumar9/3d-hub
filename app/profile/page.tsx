"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { HeartIcon, HistoryIcon, LaterIcon, PlaylistIcon, ProfileIcon } from "@/components/Icons";

export default function Profile(){const {user,loading}=useAuth();const router=useRouter();useEffect(()=>{if(!loading&&!user)router.replace("/login")},[loading,user,router]);if(loading)return <p className="page-message">Loading profile...</p>;if(!user)return <p className="page-message">Redirecting...</p>;
 return <main className="profile-page"><div className="profile-hero"><div className="profile-avatar"><ProfileIcon size={42}/></div><div><span className="eyebrow">Your account</span><h1>Profile</h1><p>{user.email}</p></div></div><div className="profile-grid">
  <Link href="/liked" className="profile-card"><HeartIcon size={28}/><div><strong>Liked</strong><span>Everything you have liked</span></div></Link>
  <Link href="/watch-later" className="profile-card"><LaterIcon size={28}/><div><strong>Watch Later</strong><span>Saved for another time</span></div></Link>
  <Link href="/playlists" className="profile-card"><PlaylistIcon size={28}/><div><strong>Playlists</strong><span>Your named collections</span></div></Link>
  <Link href="/history" className="profile-card"><HistoryIcon size={28}/><div><strong>Watch History</strong><span>Videos and audio you opened</span></div></Link>
 </div></main>}
