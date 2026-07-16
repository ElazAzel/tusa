import { z } from "zod";
import { defineGame } from "../definition";

type GameId = "mafia" | "werewolf";
type Role = "mafia" | "doctor" | "seer" | "villager";
type State = { engine:"server-v1"; game:GameId; phase:"lobby"|"night"|"day"|"vote"|"reveal"|"finished"; round:number; roles:Record<string,Role>; alive:string[]; actions:Record<string,string>; votes:Record<string,string>; eliminated:string; winner:"mafia"|"village"|""; scores:Record<string,number>; players:string[] };

function roleMap(players:string[]) { return Object.fromEntries(players.map((id,index) => [id, index === 0 ? "mafia" : index === 1 ? "doctor" : index === 2 ? "seer" : "villager"] as const)); }
function win(roles:Record<string,Role>, alive:string[]) { const mafia=alive.filter(id=>roles[id]==="mafia").length; const village=alive.length-mafia; return mafia===0 ? "village" : mafia>=village ? "mafia" : ""; }
function votedOut(votes:Record<string,string>) { const count:Record<string,number>={}; Object.values(votes).forEach(id=>{count[id]=(count[id]??0)+1;}); return Object.entries(count).sort(([leftId,left],[rightId,right])=>right-left || leftId.localeCompare(rightId))[0]?.[0]??""; }

export function createNightCouncil(id:GameId) { return defineGame<State>({
  id, version:1,
  createInitialState(players) { return { engine:"server-v1", game:id, phase:"lobby", round:0, roles:{}, alive:[...players], actions:{}, votes:{}, eliminated:"", winner:"", scores:{}, players }; },
  commandSchemas:{ start:z.object({}).strict(), nightAction:z.object({ target:z.string().min(1).max(128) }).strict(), resolveNight:z.object({}).strict(), openVote:z.object({}).strict(), vote:z.object({ target:z.string().min(1).max(128) }).strict(), revealVote:z.object({}).strict(), next:z.object({}).strict() },
  reducer(state,action,payload,ctx) {
    if(action==="start") { if(ctx.actorId!==ctx.creatorId) return {state,changed:false,error:"Only the stage can start."}; if(ctx.participants.length<5) return {state,changed:false,error:"At least five players are required."}; const roles=roleMap(ctx.participants); return {changed:true,state:{...state,phase:"night",roles,alive:[...ctx.participants],players:ctx.participants,actions:{},votes:{},eliminated:"",winner:""}}; }
    if(action==="nightAction") { if(state.phase!=="night") return {state,changed:false,error:"Night actions are closed."}; if(!state.alive.includes(ctx.actorId)) return {state,changed:false,error:"Eliminated players cannot act."}; const role=state.roles[ctx.actorId]; if(!role || role==="villager") return {state,changed:false,error:"This role has no night action."}; if(state.actions[ctx.actorId]) return {state,changed:false}; const target=(payload as {target:string}).target; if(!state.alive.includes(target)) return {state,changed:false,error:"Choose a player who is still in the game."}; return {changed:true,state:{...state,actions:{...state.actions,[ctx.actorId]:target}}}; }
    if(action==="resolveNight") { if(ctx.actorId!==ctx.creatorId || state.phase!=="night") return {state,changed:false,error:"Only the stage can resolve night."}; const mafia=Object.entries(state.roles).find(([,role])=>role==="mafia")?.[0]??""; const doctor=Object.entries(state.roles).find(([,role])=>role==="doctor")?.[0]??""; const target=state.actions[mafia]??""; const saved=state.actions[doctor]===target; const alive=target&&!saved ? state.alive.filter(id=>id!==target) : state.alive; const winner=win(state.roles,alive); return {changed:true,state:{...state,phase:winner?"reveal":"day",alive,eliminated:target&&!saved?target:"",winner,actions:{}}}; }
    if(action==="openVote") { if(ctx.actorId!==ctx.creatorId || state.phase!=="day") return {state,changed:false,error:"Only the stage can open voting."}; return {changed:true,state:{...state,phase:"vote",votes:{}}}; }
    if(action==="vote") { if(state.phase!=="vote") return {state,changed:false,error:"Voting is closed."}; if(!state.alive.includes(ctx.actorId)||state.votes[ctx.actorId]) return {state,changed:false}; const target=(payload as {target:string}).target; if(!state.alive.includes(target)) return {state,changed:false,error:"Choose a player who is still in the game."}; return {changed:true,state:{...state,votes:{...state.votes,[ctx.actorId]:target}}}; }
    if(action==="revealVote") { if(ctx.actorId!==ctx.creatorId || state.phase!=="vote") return {state,changed:false,error:"Only the stage can reveal voting."}; if(Object.keys(state.votes).length<state.alive.length) return {state,changed:false,error:"Wait for every living player to vote."}; const eliminated=votedOut(state.votes); const alive=state.alive.filter(id=>id!==eliminated); const winner=win(state.roles,alive); const scores={...state.scores}; if(winner) alive.forEach(id=>{if((winner==="mafia")=== (state.roles[id]==="mafia")) scores[id]=(scores[id]??0)+2;}); return {changed:true,state:{...state,phase:winner?"reveal":"night",round:state.round+1,alive,eliminated,winner,scores,votes:{},actions:{}}}; }
    if(action==="next") { if(ctx.actorId!==ctx.creatorId || state.phase!=="reveal") return {state,changed:false,error:"Only the stage can rematch."}; return {changed:true,state:{...state,phase:"lobby",round:0,roles:{},alive:[...ctx.participants],actions:{},votes:{},eliminated:"",winner:"",scores:{},players:ctx.participants}}; }
    return {state,changed:false,error:"Unsupported server game command."};
  },
  sanitizeForViewer(state,viewerId) { const visible={...state,roles:state.phase==="reveal"||state.phase==="finished"?state.roles:state.roles[viewerId]?{[viewerId]:state.roles[viewerId]}:{}}; return visible; },
  deriveScore(state) { return Math.max(0,...Object.values(state.scores)); },
}); }

export default createNightCouncil("werewolf");
