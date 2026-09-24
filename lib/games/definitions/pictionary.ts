import { z } from "zod";
import { defineGame } from "../definition";
import { deckItem, deckOf, initialDeck, type DeckState } from "../content-deck";
import { SHOWABLE_WORDS } from "../content/showable";

const GUESSES_PER_ROUND = 3;
export const PICTIONARY_ROUNDS = 5;
const drawable = (pool: readonly string[]) => pool.filter((word) => word.split(" ").length <= 2);
const WORDS = { ru: drawable(SHOWABLE_WORDS.ru), en: drawable(SHOWABLE_WORDS.en) };
const normalizeGuess = (value: string) => value.trim().toLocaleLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ");
const point = z.object({ x:z.number().int().min(0).max(600), y:z.number().int().min(0).max(360), draw:z.boolean() });
type Point = z.infer<typeof point>;
type State = DeckState & { locale:"ru"|"en"; engine:"server-v1"; game:"pictionary"; phase:"lobby"|"drawing"|"result"|"finished"; players:string[]; drawerId:string; word:string; points:Point[]; guesses:Array<{userId:string;text:string}>; round:number; scores:Record<string,number>; winner:string; deadline:number; privateWord?:string };

export default defineGame<State>({
  id:"pictionary", version:1,
  createInitialState(players, config) { return { ...initialDeck(config, "pictionary"), locale: config.locale === "en" ? "en" : "ru", engine:"server-v1", game:"pictionary", phase:"lobby", players, drawerId:"", word:"", points:[], guesses:[], round:0, scores:{}, winner:"", deadline:0 }; },
  commandSchemas:{ start:z.object({}).strict(), stroke:z.object({points:z.array(point).min(1).max(24)}).strict(), guess:z.object({text:z.string().trim().min(1).max(80)}).strict(), reveal:z.object({}).strict(), next:z.object({}).strict(), finish:z.object({}).strict() },
  reducer(state, action, payload, ctx) {
    if (action === "start" || action === "next") {
      if (ctx.actorId !== ctx.creatorId || (action === "start" && state.phase !== "lobby") || (action === "next" && state.phase !== "result")) return { state, changed:false, error:"Only the stage can start the next round." };
      if (ctx.participants.length < 3) return { state, changed:false, error:"At least three players are required." };
      const round = state.round + 1;
      if (round > PICTIONARY_ROUNDS) return { changed:true, state:{ ...state, phase:"finished" } };
      return { changed:true, state:{ ...state, phase:"drawing", players:[...ctx.participants], drawerId:ctx.participants[(round - 1) % ctx.participants.length], word:deckItem(WORDS[state.locale ?? "ru"], deckOf(state), round - 1), contentUsed: round, points:[], guesses:[], winner:"", round, deadline:ctx.now + 90_000 } };
    }
    if (action === "stroke") {
      if (state.phase !== "drawing" || ctx.actorId !== state.drawerId) return { state, changed:false, error:"Only the drawer can add strokes." };
      return { changed:true, state:{ ...state, points:[...state.points, ...(payload as {points:Point[]}).points].slice(-2500) } };
    }
    if (action === "guess") {
      if (state.phase !== "drawing" || ctx.actorId === state.drawerId) return { state, changed:false, error:"Guesses are closed." };
      const text = (payload as {text:string}).text;
      if (state.guesses.filter((guess) => guess.userId === ctx.actorId).length >= GUESSES_PER_ROUND) return { state, changed:false, error:"No guesses left this round." };
      const guesses=[...state.guesses,{userId:ctx.actorId,text}];
      if (normalizeGuess(text) === normalizeGuess(state.word)) return { changed:true, state:{ ...state, phase:"result", guesses, winner:ctx.actorId, scores:{...state.scores,[ctx.actorId]:(state.scores[ctx.actorId]??0)+3,[state.drawerId]:(state.scores[state.drawerId]??0)+2}, deadline:0 } };
      return { changed:true, state:{ ...state, guesses:guesses.slice(-30) } };
    }
    if (action === "reveal") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "drawing") return { state, changed:false, error:"Only the stage can reveal the word." };
      return { changed:true, state:{ ...state, phase:"result", winner:"", deadline:0 } };
    }
    if (action === "finish") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "result") return { state, changed:false, error:"Only the stage can finish." };
      return { changed:true, state:{ ...state, phase:"finished" } };
    }
    return { state, changed:false, error:"Unsupported server game command." };
  },
  sanitizeForViewer(state, viewer) { return viewer === "__stage__" || viewer === state.drawerId || state.phase === "result" || state.phase === "finished" ? { ...state, privateWord:state.word } : { ...state, word:"", privateWord:"" }; },
  deriveScore: (state) => Math.max(0, ...Object.values(state.scores)),
});
