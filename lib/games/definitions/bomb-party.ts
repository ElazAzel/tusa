import { z } from "zod";
import { defineGame } from "../definition";
import { WORD_BOMB_LETTERS } from "../word-bomb-content";

type State = {
  engine: "server-v1";
  game: "bombParty";
  locale: "ru" | "en";
  phase: "play" | "result" | "finished";
  round: number;
  letter: string;
  deadline: number;
  submissions: Record<string, string>;
  usedWords: string[];
  eliminated: string[];
  winner?: string | null;
  players: string[];
};

export default defineGame<State>({
  id: "bombParty",
  version: 1,
  createInitialState(participants, config, now = Date.now()) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: "bombParty",
      locale,
      phase: "play",
      round: 0,
      letter: WORD_BOMB_LETTERS[locale][0],
      deadline: now + 20_000,
      submissions: {},
      usedWords: [],
      eliminated: [],
      players: participants,
    };
  },
  commandSchemas: {
    submit: z.object({ word: z.string().trim().min(1).max(40) }).strict(),
    finalize: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    const alive = ctx.participants.filter((id) => !state.eliminated.includes(id));
    if (actionType === "submit") {
      if (state.phase !== "play" || ctx.now > state.deadline) return { state, changed: false, error: "This round is closed." };
      if (!alive.includes(ctx.actorId)) return { state, changed: false, error: "Eliminated players cannot submit." };
      if (state.submissions[ctx.actorId]) return { state, changed: false };
      const word = (payload as { word: string }).word.trim().replace(/\s+/g, " ");
      const normalized = word.toLocaleLowerCase(state.locale);
      if (word.length < 2 || !word.toLocaleUpperCase(state.locale).startsWith(state.letter)) return { state, changed: false, error: `The word must start with ${state.letter}.` };
      if (state.usedWords.includes(normalized) || Object.values(state.submissions).some((value) => value.toLocaleLowerCase(state.locale) === normalized)) return { state, changed: false, error: "That word was already used." };
      return { changed: true, state: { ...state, submissions: { ...state.submissions, [ctx.actorId]: word } } };
    }
    if (actionType === "finalize") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can close the round." };
      const everyoneAnswered = alive.length > 0 && alive.every((id) => state.submissions[id]);
      if (state.phase !== "play" || (ctx.now < state.deadline && !everyoneAnswered)) return { state, changed: false, error: "The round is still active." };
      const eliminated = [...new Set([...state.eliminated, ...alive.filter((id) => !state.submissions[id])])];
      const usedWords = [...state.usedWords, ...Object.values(state.submissions).map((w) => w.toLocaleLowerCase(state.locale))];
      return { changed: true, state: { ...state, phase: "result", eliminated, usedWords } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "result") return { state, changed: false, error: "Close the current round first." };
      const survivors = ctx.participants.filter((id) => !state.eliminated.includes(id));
      const round = state.round + 1;
      if (survivors.length <= 1 || round >= WORD_BOMB_LETTERS[state.locale].length) return { changed: true, state: { ...state, phase: "finished", winner: survivors[0] ?? null } };
      return { changed: true, state: { ...state, phase: "play", round, letter: WORD_BOMB_LETTERS[state.locale][round], deadline: ctx.now + 20_000, submissions: {} } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(s) {
    return s.winner ? 1 : 0;
  },
});
