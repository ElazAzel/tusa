import { z } from "zod";
import { defineGame } from "../definition";

const traits = ["Chef", "Doctor", "Engineer", "Navigator", "Farmer", "Medic", "Climber", "Linguist", "Builder", "Musician"];

type State = { engine:"server-v1"; game:"bunker"; phase:"lobby"|"argue"|"vote"|"result"|"finished"; players:string[]; traits:Record<string,string>; votes:Record<string,string>; survivors:string[]; deadline:number; round:number };

function resolve(votes: Record<string,string>, players: string[]) {
  const tally: Record<string,number> = {};
  Object.values(votes).forEach((id) => { tally[id] = (tally[id] ?? 0) + 1; });
  return [...players].sort((a,b) => (tally[b] ?? 0) - (tally[a] ?? 0) || a.localeCompare(b)).slice(0, Math.max(2, Math.ceil(players.length / 2)));
}

export default defineGame<State>({
  id:"bunker", version:1,
  createInitialState(players) { return { engine:"server-v1", game:"bunker", phase:"lobby", players, traits:{}, votes:{}, survivors:[], deadline:0, round:0 }; },
  commandSchemas:{ start:z.object({}).strict(), openVote:z.object({}).strict(), vote:z.object({target:z.string().min(1).max(128)}).strict(), resolve:z.object({}).strict(), finish:z.object({}).strict() },
  reducer(state, action, payload, ctx) {
    if (action === "start") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed:false, error:"Only the stage can start." };
      if (ctx.participants.length < 5) return { state, changed:false, error:"At least five players are required." };
      const assigned = Object.fromEntries(ctx.participants.map((id, index) => [id, traits[index % traits.length]]));
      return { changed:true, state:{ ...state, phase:"argue", players:[...ctx.participants], traits:assigned, votes:{}, survivors:[], deadline:ctx.now + 90_000, round:1 } };
    }
    if (action === "openVote") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "argue") return { state, changed:false, error:"Only the stage can open voting." };
      return { changed:true, state:{ ...state, phase:"vote", votes:{}, deadline:ctx.now + 60_000 } };
    }
    if (action === "vote") {
      if (state.phase !== "vote") return { state, changed:false, error:"Voting is closed." };
      if (!state.players.includes(ctx.actorId) || state.votes[ctx.actorId]) return { state, changed:false };
      const target = (payload as { target:string }).target;
      if (!state.players.includes(target) || target === ctx.actorId) return { state, changed:false, error:"Choose another active player." };
      return { changed:true, state:{ ...state, votes:{ ...state.votes, [ctx.actorId]:target } } };
    }
    if (action === "resolve") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "vote") return { state, changed:false, error:"Only the stage can resolve the vote." };
      return { changed:true, state:{ ...state, phase:"result", survivors:resolve(state.votes, state.players), deadline:0 } };
    }
    if (action === "finish") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "result") return { state, changed:false, error:"Only the stage can finish." };
      return { changed:true, state:{ ...state, phase:"finished" } };
    }
    return { state, changed:false, error:"Unsupported server game command." };
  },
  sanitizeForViewer(state, viewer) {
    if (viewer === "__stage__" || state.phase === "result" || state.phase === "finished") return state;
    return { ...state, traits: state.traits[viewer] ? { [viewer]:state.traits[viewer] } : {} };
  },
  deriveScore: (state) => state.survivors.length,
});
