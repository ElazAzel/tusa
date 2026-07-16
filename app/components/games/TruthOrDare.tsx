"use client";
import SocialTool from "@/app/components/games/SocialTool";
export default function TruthOrDare(props:{partyId:string;sessionId?:string|null;onSave:(score:number)=>void;role?:"stage"|"controller"}){return <SocialTool {...props} game="truth"/>;}
