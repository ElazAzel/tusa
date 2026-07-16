import { z } from "zod";
import { defineGame } from "../definition";
import { FOREHEAD_GUESS_WORDS } from "../forehead-guess-content";

type State = {
  engine: "server-v1";
  game: "headsup";
  locale: "ru" | "en";
  phase: "play" | "result" | "finished";
  round: number;
  activePlayer: string;
  deadline: number;
  wordIndex: number;
  word: string;
  score: number;
  roundScore: number;
  skipped: number;
  lastAction: "correct" | "skip" | "";
  players: string[];
};

function wordFor(index: number, locale: "ru" | "en") {
  return FOREHEAD_GUESS_WORDS[locale][index % FOREHEAD_GUESS_WORDS[locale].length];
}

export default defineGame<State>({
  id: "headsup",
  version: 1,
  createInitialState(participants, config, now = Date.now()) {
    const locale = config.locale === "en" ? "en" : "ru";
    return { engine: "server-v1", game: "headsup", locale, phase: "play", round: 0, activePlayer: participants[0] ?? "", deadline: now + 60_000, wordIndex: 0, word: wordFor(0, locale), score: 0, roundScore: 0, skipped: 0, lastAction: "", players: participants };
  },
  commandSchemas: { correct: z.object({}).strict(), skip: z.object({}).strict(), finalize: z.object({}).strict(), next: z.object({}).strict() },
  reducer(state, actionType, _payload, ctx) {
    if (actionType === "correct" || actionType === "skip") {
      if (state.phase !== "play" || ctx.now > state.deadline) return { state, changed: false, error: "This turn is closed." };
      if (ctx.actorId === state.activePlayer) return { state, changed: false, error: "The active player cannot see or score their own word." };
      if (!ctx.participants.includes(ctx.actorId)) return { state, changed: false, error: "Only session participants can score the turn." };
      const wordIndex = state.wordIndex + 1;
      const scored = actionType === "correct" ? 1 : 0;
      return { changed: true, state: { ...state, wordIndex, word: wordFor(wordIndex, state.locale), score: state.score + scored, roundScore: state.roundScore + scored, skipped: state.skipped + (actionType === "skip" ? 1 : 0), lastAction: actionType } };
    }
    if (actionType === "finalize") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "play") return { state, changed: false, error: "Only the stage can close the turn." };
      if (ctx.now < state.deadline) return { state, changed: false, error: "The turn is still active." };
      return { changed: true, state: { ...state, phase: "result" } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "result") return { state, changed: false, error: "Only the stage can advance after results." };
      const round = state.round + 1;
      if (round >= 5) return { changed: true, state: { ...state, phase: "finished" } };
      const wordIndex = state.wordIndex + 1;
      return { changed: true, state: { ...state, phase: "play", round, activePlayer: ctx.participants[round % ctx.participants.length] ?? "", deadline: ctx.now + 60_000, wordIndex, word: wordFor(wordIndex, state.locale), roundScore: 0, skipped: 0, lastAction: "", players: ctx.participants } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(state) { return state.score; },
});
