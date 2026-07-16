import { z } from "zod";
import { defineGame } from "../definition";

const words = ["Astronaut", "Giraffe", "Volcano", "Popcorn", "Dinosaur", "Umbrella"];
const point = z.object({ x:z.number().int().min(0).max(600), y:z.number().int().min(0).max(360), draw:z.boolean() });
type Point = z.infer<typeof point>;
type State = { engine:"server-v1"; game:"pictionary"; phase:"lobby"|"drawing"|"result"|"finished"; players:string[]; drawerId:string; word:string; points:Point[]; guesses:Array<{userId:string;text:string}>; round:number; scores:Record<string,number>; winner:string; deadline:number; privateWord?:string };

export default defineGame<State>({
  id:"pictionary", version:1,
  createInitialState(players) { return { engine:"server-v1", game:"pictionary", phase:"lobby", players, drawerId:"", word:"", points:[], guesses:[], round:0, scores:{}, winner:"", deadline:0 }; },
  commandSchemas:{ start:z.object({}).strict(), stroke:z.object({points:z.array(point).min(1).max(24)}).strict(), guess:z.object({text:z.string().trim().min(1).max(80)}).strict(), next:z.object({}).strict(), finish:z.object({}).strict() },
  reducer(state, action, payload, ctx) {
    if (action === "start" || action === "next") {
      if (ctx.actorId !== ctx.creatorId || (action === "start" && state.phase !== "lobby") || (action === "next" && state.phase !== "result")) return { state, changed:false, error:"Only the stage can start the next round." };
      if (ctx.participants.length < 3) return { state, changed:false, error:"At least three players are required." };
      const round = state.round + 1;
      return { changed:true, state:{ ...state, phase:"drawing", players:[...ctx.participants], drawerId:ctx.participants[(round - 1) % ctx.participants.length], word:words[(round - 1) % words.length], points:[], guesses:[], winner:"", round, deadline:ctx.now + 90_000 } };
    }
    if (action === "stroke") {
      if (state.phase !== "drawing" || ctx.actorId !== state.drawerId) return { state, changed:false, error:"Only the drawer can add strokes." };
      return { changed:true, state:{ ...state, points:[...state.points, ...(payload as {points:Point[]}).points].slice(-2500) } };
    }
    if (action === "guess") {
      if (state.phase !== "drawing" || ctx.actorId === state.drawerId) return { state, changed:false, error:"Guesses are closed." };
      const text = (payload as {text:string}).text;
      if (state.guesses.some((guess) => guess.userId === ctx.actorId)) return { state, changed:false };
      const guesses=[...state.guesses,{userId:ctx.actorId,text}];
      if (text.localeCompare(state.word, undefined, { sensitivity:"accent" }) === 0) return { changed:true, state:{ ...state, phase:"result", guesses, winner:ctx.actorId, scores:{...state.scores,[ctx.actorId]:(state.scores[ctx.actorId]??0)+3,[state.drawerId]:(state.scores[state.drawerId]??0)+2}, deadline:0 } };
      return { changed:true, state:{ ...state, guesses:guesses.slice(-12) } };
    }
    if (action === "finish") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "result") return { state, changed:false, error:"Only the stage can finish." };
      return { changed:true, state:{ ...state, phase:"finished" } };
    }
    return { state, changed:false, error:"Unsupported server game command." };
  },
  sanitizeForViewer(state, viewer) { return viewer === "__stage__" || viewer === state.drawerId ? { ...state, privateWord:state.word } : { ...state, word:"", privateWord:"" }; },
  deriveScore: (state) => Math.max(0, ...Object.values(state.scores)),
});
