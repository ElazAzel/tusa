import { z } from "zod";
import { defineGame } from "../definition";
import { deckItem, deckOf, initialDeck, type DeckState } from "../content-deck";
import { BUNKER_BAGGAGE, BUNKER_HEALTH, BUNKER_HOBBIES, BUNKER_PROFESSIONS, BUNKER_SCENARIOS, BUNKER_SECRETS, type BunkerText } from "../content/bunker";

type Locale = "ru" | "en";
export type BunkerCard = { profession:string; health:string; hobby:string; baggage:string; secret:string };
type State = { engine:"server-v1"; game:"bunker"; locale:Locale; phase:"lobby"|"argue"|"vote"|"result"|"finished"; players:string[]; scenario:string; traits:Record<string,string>; cards:Record<string,BunkerCard>; votes:Record<string,string>; survivors:string[]; deadline:number; round:number } & DeckState;

const CATEGORIES: Record<keyof BunkerCard, readonly BunkerText[]> = { profession:BUNKER_PROFESSIONS, health:BUNKER_HEALTH, hobby:BUNKER_HOBBIES, baggage:BUNKER_BAGGAGE, secret:BUNKER_SECRETS };

function pick(state: State, category: string, pool: readonly BunkerText[], position: number) {
  const deck = deckOf(state);
  return deckItem(pool, { deckSeed:`${deck.deckSeed}:${category}`, deckStart:deck.deckStart }, position)[state.locale];
}

function dealCards(state: State, players: string[]) {
  const cards = Object.fromEntries(players.map((id, index) => [id, Object.fromEntries(Object.entries(CATEGORIES).map(([category, pool]) => [category, pick(state, category, pool, index)])) as BunkerCard]));
  return { cards, traits:Object.fromEntries(players.map((id) => [id, cards[id].profession])), scenario:pick(state, "scenario", BUNKER_SCENARIOS, 0) };
}

function resolve(votes: Record<string,string>, players: string[]) {
  const tally: Record<string,number> = {};
  Object.values(votes).forEach((id) => { tally[id] = (tally[id] ?? 0) + 1; });
  return [...players].sort((a,b) => (tally[b] ?? 0) - (tally[a] ?? 0) || a.localeCompare(b)).slice(0, Math.max(2, Math.ceil(players.length / 2)));
}

export default defineGame<State>({
  id:"bunker", version:1,
  createInitialState(players, config) { return { ...initialDeck(config, "bunker"), contentUsed:0, engine:"server-v1", game:"bunker", locale:config.locale === "en" ? "en" : "ru", phase:"lobby", players, scenario:"", traits:{}, cards:{}, votes:{}, survivors:[], deadline:0, round:0 }; },
  commandSchemas:{ start:z.object({}).strict(), openVote:z.object({}).strict(), vote:z.object({target:z.string().min(1).max(128)}).strict(), resolve:z.object({}).strict(), finish:z.object({}).strict() },
  reducer(state, action, payload, ctx) {
    if (action === "start") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed:false, error:"Only the stage can start." };
      if (ctx.participants.length < 5) return { state, changed:false, error:"At least five players are required." };
      const dealt = dealCards(state, ctx.participants);
      return { changed:true, state:{ ...state, ...dealt, contentUsed:ctx.participants.length, phase:"argue", players:[...ctx.participants], votes:{}, survivors:[], deadline:ctx.now + 90_000, round:1 } };
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
    return { ...state, traits: state.traits[viewer] ? { [viewer]:state.traits[viewer] } : {}, cards: state.cards?.[viewer] ? { [viewer]:state.cards[viewer] } : {} };
  },
  deriveScore: (state) => state.survivors.length,
});
