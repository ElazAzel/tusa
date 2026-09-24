import { z } from "zod";
import { defineGame } from "../definition";
import { deckItem, deckOf, initialDeck, type DeckState } from "../content-deck";
import { SOCIAL_PROMPTS } from "../content/social";

type Locale = "ru" | "en";
type Mode = "truth" | "dare" | "never" | "pair";
type Social = {
  engine: "server-v1";
  game: "truth" | "never" | "pairs";
  locale: Locale;
  phase: "choose" | "round" | "finished";
  round: number;
  prompt: string;
  mode: Mode;
  responses: Record<string, boolean>;
  pairs: string[][];
  players: string[];
  drawn: Partial<Record<Mode, number>>;
} & DeckState;

function draw(state: Pick<Social, "locale" | "drawn" | "deckSeed" | "deckStart">, mode: Mode) {
  const position = state.drawn[mode] ?? 0;
  const deck = deckOf(state);
  const prompt = deckItem(SOCIAL_PROMPTS[state.locale][mode], { deckSeed: `${deck.deckSeed}:${mode}`, deckStart: deck.deckStart }, position);
  const drawn = { ...state.drawn, [mode]: position + 1 };
  return { prompt, drawn, contentUsed: Object.values(drawn).reduce((sum, count) => sum + (count ?? 0), 0) };
}

function pairs(players: string[], round: number) {
  const order = [...players].sort((a, b) => a.localeCompare(b));
  if (order.length > 1) {
    const offset = round % order.length;
    order.push(...order.splice(0, offset));
  }
  return Array.from({ length: Math.ceil(order.length / 2) }, (_, index) => order.slice(index * 2, index * 2 + 2));
}

export function createSocialTool(id: Social["game"]) {
  return defineGame<Social>({
    id,
    version: 1,
    createInitialState(players, config) {
      const locale: Locale = config.locale === "en" ? "en" : "ru";
      const mode: Mode = id === "never" ? "never" : id === "pairs" ? "pair" : "truth";
      const base = { ...initialDeck(config, id), locale, drawn: {} };
      const first = id === "truth" ? { prompt: "", drawn: {}, contentUsed: 0 } : draw(base, mode);
      return { ...base, ...first, engine: "server-v1", game: id, phase: id === "truth" ? "choose" : "round", round: 0, mode, responses: {}, pairs: id === "pairs" ? pairs(players, 0) : [], players };
    },
    commandSchemas: {
      choose: z.object({ mode: z.enum(["truth", "dare"]) }).strict(),
      respond: z.object({ value: z.boolean() }).strict(),
      next: z.object({}).strict(),
      finish: z.object({}).strict(),
    },
    reducer(state, action, payload, ctx) {
      if (action === "choose") {
        if (state.game !== "truth" || state.phase !== "choose" || ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can choose a card." };
        const mode = (payload as { mode: "truth" | "dare" }).mode;
        return { changed: true, state: { ...state, ...draw(state, mode), phase: "round", mode, responses: {} } };
      }
      if (action === "respond") {
        if (state.phase !== "round" || state.responses[ctx.actorId]) return { state, changed: false };
        return { changed: true, state: { ...state, responses: { ...state.responses, [ctx.actorId]: (payload as { value: boolean }).value } } };
      }
      if (action === "next") {
        if (ctx.actorId !== ctx.creatorId || state.phase !== "round") return { state, changed: false, error: "Only the stage can advance." };
        const round = state.round + 1;
        const mode: Mode = state.game === "truth" ? state.mode : state.game === "never" ? "never" : "pair";
        return { changed: true, state: { ...state, ...draw(state, mode), round, responses: {}, pairs: state.game === "pairs" ? pairs(ctx.participants, round) : state.pairs } };
      }
      if (action === "finish") {
        if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can finish." };
        return { changed: true, state: { ...state, phase: "finished" } };
      }
      return { state, changed: false, error: "Unsupported server game command." };
    },
    deriveScore: (s) => s.round + Object.values(s.responses).filter(Boolean).length,
  });
}
