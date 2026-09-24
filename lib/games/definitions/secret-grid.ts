import { z } from "zod";
import { defineGame } from "../definition";
import { deckIndex, deckItem, deckOf, initialDeck, type DeckState } from "../content-deck";
import { ALIAS_WORDS_EN } from "../content/alias-en";
import { ALIAS_WORDS_RU } from "../content/alias-ru";

type Color = "a" | "b" | "neutral" | "assassin";
type State = {
  engine: "server-v1";
  game: "codenames";
  locale: "ru" | "en";
  phase: "assign" | "clue" | "guess" | "reveal" | "finished";
  round: number;
  board: string[];
  colors: Color[];
  revealed: boolean[];
  activeTeam: "a" | "b";
  spymasterA: string | null;
  spymasterB: string | null;
  clue: string;
  clueNumber: number;
  guessesRemaining: number;
  scores: { a: number; b: number };
  winner: "a" | "b" | "";
  players: string[];
} & DeckState;

const singleWords = (pool: readonly string[]) => pool.filter((word) => /^[\p{L}-]{3,12}$/u.test(word)).map((word) => word.toLocaleUpperCase());
const words = { en: singleWords(ALIAS_WORDS_EN), ru: singleWords(ALIAS_WORDS_RU) };
const BOARD_SIZE = 16;

const colorDeck: Color[] = ["a", "a", "a", "a", "a", "a", "b", "b", "b", "b", "b", "b", "neutral", "neutral", "neutral", "assassin"];

function board(locale: "ru" | "en", round: number, deckSource: { deckSeed?: string; deckStart?: number }) {
  const deck = deckOf(deckSource);
  const colorOrder = { deckSeed: `${deck.deckSeed}:colors:${deck.deckStart}:${round}`, deckStart: 0 };
  return {
    board: Array.from({ length: BOARD_SIZE }, (_, index) => deckItem(words[locale], deck, round * BOARD_SIZE + index)),
    colors: Array.from({ length: BOARD_SIZE }, (_, index) => colorDeck[deckIndex(BOARD_SIZE, colorOrder, index)]),
    contentUsed: (round + 1) * BOARD_SIZE,
  };
}

function remaining(state: State, team: "a" | "b") {
  return state.colors.reduce((total, color, index) => total + (color === team && !state.revealed[index] ? 1 : 0), 0);
}

function nextTurn(state: State, revealed: boolean[]) {
  const activeTeam = state.activeTeam === "a" ? "b" : "a";
  return { ...state, revealed, activeTeam, phase: "clue" as const, clue: "", clueNumber: 0, guessesRemaining: 0 };
}

export default defineGame<State>({
  id: "codenames",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    const deck = initialDeck(config, "codenames");
    const grid = board(locale, 0, deck);
    return { ...deck, engine: "server-v1", game: "codenames", locale, phase: "assign", round: 0, ...grid, revealed: Array(16).fill(false), activeTeam: "a", spymasterA: null, spymasterB: null, clue: "", clueNumber: 0, guessesRemaining: 0, scores: { a: 0, b: 0 }, winner: "", players: participants };
  },
  commandSchemas: {
    setSpymaster: z.object({ tm: z.enum(["a", "b"]) }).strict(),
    giveClue: z.object({ wd: z.string().trim().min(1).max(40), nm: z.number().int().min(1).max(9) }).strict(),
    pickWord: z.object({ idx: z.number().int().min(0).max(15) }).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "setSpymaster") {
      if (state.phase !== "assign") return { state, changed: false, error: "Role assignment is closed." };
      const team = (payload as { tm: "a" | "b" }).tm;
      const key = team === "a" ? "spymasterA" : "spymasterB";
      if (state[key] && state[key] !== ctx.actorId) return { state, changed: false, error: "This team already has a spymaster." };
      if ((team === "a" ? state.spymasterB : state.spymasterA) === ctx.actorId) return { state, changed: false, error: "A player can lead only one team." };
      const next = { ...state, [key]: ctx.actorId } as State;
      return { changed: true, state: { ...next, phase: next.spymasterA && next.spymasterB ? "clue" : "assign" } };
    }
    if (actionType === "giveClue") {
      if (state.phase !== "clue") return { state, changed: false, error: "Wait for the next clue." };
      const leader = state.activeTeam === "a" ? state.spymasterA : state.spymasterB;
      if (ctx.actorId !== leader) return { state, changed: false, error: "Only the active spymaster can give a clue." };
      const { wd, nm } = payload as { wd: string; nm: number };
      return { changed: true, state: { ...state, phase: "guess", clue: wd.trim(), clueNumber: nm, guessesRemaining: nm + 1 } };
    }
    if (actionType === "pickWord") {
      if (state.phase !== "guess") return { state, changed: false, error: "Guesses are closed." };
      if (ctx.actorId === state.spymasterA || ctx.actorId === state.spymasterB) return { state, changed: false, error: "Spymasters cannot select a word." };
      const index = (payload as { idx: number }).idx;
      if (state.revealed[index]) return { state, changed: false };
      const revealed = [...state.revealed];
      revealed[index] = true;
      const color = state.colors[index];
      if (color === "assassin") return { changed: true, state: { ...state, revealed, phase: "finished", winner: state.activeTeam === "a" ? "b" : "a" } };
      const scores = color === "a" || color === "b" ? { ...state.scores, [color]: state.scores[color] + 1 } : state.scores;
      if (color === "a" || color === "b") {
        if (remaining({ ...state, revealed, scores }, color) === 0) return { changed: true, state: { ...state, revealed, scores, phase: "finished", winner: color } };
        if (color === state.activeTeam && state.guessesRemaining > 1) return { changed: true, state: { ...state, revealed, scores, guessesRemaining: state.guessesRemaining - 1 } };
      }
      return { changed: true, state: nextTurn({ ...state, scores }, revealed) };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "finished") return { state, changed: false, error: "Only the stage can start a rematch." };
      const round = state.round + 1;
      const grid = board(state.locale, round, state);
      return { changed: true, state: { ...state, round, ...grid, phase: "clue", revealed: Array(16).fill(false), activeTeam: state.activeTeam === "a" ? "b" : "a", clue: "", clueNumber: 0, guessesRemaining: 0, winner: "", players: ctx.participants } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  sanitizeForViewer(state, viewerId) {
    if (viewerId === "__stage__" || viewerId === state.spymasterA || viewerId === state.spymasterB) return state;
    return { ...state, colors: state.colors.map((color, index) => state.revealed[index] ? color : "neutral") };
  },
  deriveScore(state) {
    return Math.max(state.scores.a, state.scores.b);
  },
});
