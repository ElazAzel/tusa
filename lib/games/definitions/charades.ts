import { z } from "zod";
import { defineGame } from "../definition";
import { CHARADES_WORDS } from "../charades-content";

type State = {
  engine: "server-v1";
  game: "charades";
  locale: "ru" | "en";
  phase: "play" | "result" | "finished";
  round: number;
  activePlayer: string;
  deadline: number;
  wordIndex: number;
  word: string;
  score: number;
  roundScore: number;
  players: string[];
};

function wordFor(index: number, locale: "ru" | "en") {
  return CHARADES_WORDS[locale][index % CHARADES_WORDS[locale].length];
}

export default defineGame<State>({
  id: "charades",
  version: 1,
  createInitialState(participants, config, now = Date.now()) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: "charades",
      locale,
      phase: "play",
      round: 0,
      activePlayer: participants[0] ?? "",
      deadline: now + 60_000,
      wordIndex: 0,
      word: wordFor(0, locale),
      score: 0,
      roundScore: 0,
      players: participants,
    };
  },
  commandSchemas: {
    correct: z.object({}).strict(),
    skip: z.object({}).strict(),
    finalize: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, _payload, ctx) {
    if (actionType === "correct" || actionType === "skip") {
      if (state.phase !== "play" || ctx.now > state.deadline) return { state, changed: false, error: "This turn is closed." };
      if (ctx.actorId !== state.activePlayer) return { state, changed: false, error: "Only the active player can control the turn." };
      const wordIndex = state.wordIndex + 1;
      const scored = actionType === "correct" ? 1 : 0;
      return { changed: true, state: { ...state, wordIndex, word: wordFor(wordIndex, state.locale), score: state.score + scored, roundScore: state.roundScore + scored } };
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
      const players = ctx.participants;
      return { changed: true, state: { ...state, phase: "play", round, activePlayer: players[round % players.length] ?? "", deadline: ctx.now + 60_000, wordIndex, word: wordFor(wordIndex, state.locale), roundScore: 0, players } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(state) {
    return state.score;
  },
});
