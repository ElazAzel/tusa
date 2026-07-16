import { z } from "zod";
import { defineGame } from "../definition";

const point = z.object({ x:z.number().int().min(0).max(600), y:z.number().int().min(0).max(360), draw:z.boolean() });
type Point = z.infer<typeof point>;
type State = { engine:"server-v1"; game:"gartic"; phase:"lobby"|"prompt"|"draw"|"guess"|"reveal"|"finished"; players:string[]; prompts:Record<string,string>; assignments:Record<string,string>; drawings:Record<string,Point[]>; guesses:Record<string,string>; completed:string[]; revealIndex:number; deadline:number; scores:Record<string,number>; privatePrompt?:string; privateDrawing?:Point[] };

const ready = (state: State, field: Record<string,unknown>) => state.players.length > 0 && state.players.every((id) => Boolean(field[id]));

export default defineGame<State>({
  id:"gartic", version:1,
  createInitialState(players) { return { engine:"server-v1", game:"gartic", phase:"lobby", players, prompts:{}, assignments:{}, drawings:{}, guesses:{}, completed:[], revealIndex:0, deadline:0, scores:{} }; },
  commandSchemas:{ start:z.object({}).strict(), prompt:z.object({text:z.string().trim().min(1).max(80)}).strict(), stroke:z.object({points:z.array(point).min(1).max(24)}).strict(), drawingDone:z.object({}).strict(), guess:z.object({text:z.string().trim().min(1).max(80)}).strict(), advance:z.object({}).strict(), finish:z.object({}).strict() },
  reducer(state, action, payload, ctx) {
    if (action === "start") { if (ctx.actorId !== ctx.creatorId || state.phase !== "lobby") return {state,changed:false,error:"Only the stage can start."}; if (ctx.participants.length < 4) return {state,changed:false,error:"At least four players are required."}; return {changed:true,state:{...state,phase:"prompt",players:[...ctx.participants],deadline:ctx.now+75_000}}; }
    if (action === "prompt") { if (state.phase !== "prompt" || !state.players.includes(ctx.actorId) || state.prompts[ctx.actorId]) return {state,changed:false}; const prompts={...state.prompts,[ctx.actorId]:(payload as {text:string}).text}; if (!ready(state,prompts)) return {changed:true,state:{...state,prompts}}; const assignments=Object.fromEntries(state.players.map((id,index)=>[id,state.players[(index+1)%state.players.length]])); return {changed:true,state:{...state,prompts,assignments,phase:"draw",deadline:ctx.now+120_000}}; }
    if (action === "stroke") { if (state.phase !== "draw" || !state.players.includes(ctx.actorId) || state.completed.includes(ctx.actorId)) return {state,changed:false,error:"Drawing is closed."}; return {changed:true,state:{...state,drawings:{...state.drawings,[ctx.actorId]:[...(state.drawings[ctx.actorId]??[]),...(payload as {points:Point[]}).points].slice(-2200)}}}; }
    if (action === "drawingDone") { if (state.phase !== "draw" || !state.players.includes(ctx.actorId) || state.completed.includes(ctx.actorId)) return {state,changed:false}; const completed=[...state.completed,ctx.actorId]; return {changed:true,state:completed.length===state.players.length?{...state,phase:"guess",completed,deadline:ctx.now+75_000}:{...state,completed}}; }
    if (action === "guess") { if (state.phase !== "guess" || !state.players.includes(ctx.actorId) || state.guesses[ctx.actorId]) return {state,changed:false}; const guesses={...state.guesses,[ctx.actorId]:(payload as {text:string}).text}; return {changed:true,state:ready(state,guesses)?{...state,phase:"reveal",guesses,revealIndex:0,deadline:0,scores:Object.fromEntries(state.players.map(id=>[id,1]))}:{...state,guesses}}; }
    if (action === "advance") { if (ctx.actorId !== ctx.creatorId || state.phase !== "reveal") return {state,changed:false,error:"Only the stage can advance."}; return {changed:true,state:state.revealIndex>=state.players.length-1?{...state,phase:"finished"}:{...state,revealIndex:state.revealIndex+1}}; }
    if (action === "finish") { if (ctx.actorId !== ctx.creatorId) return {state,changed:false,error:"Only the stage can finish."}; return {changed:true,state:{...state,phase:"finished"}}; }
    return {state,changed:false,error:"Unsupported server game command."};
  },
  sanitizeForViewer(state, viewer) { const source=state.assignments[viewer]; return viewer === "__stage__" ? state : { ...state, prompts:{}, privatePrompt:source?state.prompts[source]??"":"", privateDrawing:source?state.drawings[source]??[]:[] }; },
  deriveScore: (state) => Math.max(0,...Object.values(state.scores)),
});
