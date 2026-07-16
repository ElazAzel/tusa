"use client";
import GuessSong from "@/app/components/games/GuessSong";

// Music Quiz intentionally reuses the licensed-audio-safe Guess Song engine:
// synchronized round, answer lock, timer and leaderboard. Content packs differ
// at catalogue level while the multiplayer protocol stays identical.
export default function MusicQuiz(props:{partyId:string;sessionId?:string|null;onSave:(score:number)=>void;role?:"stage"|"controller"}){return <GuessSong {...props} mode="musicQuiz"/>}
