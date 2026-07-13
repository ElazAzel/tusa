import { z } from "zod";
import { defineGame } from "../definition";
import { IMPOSTOR_WORDS } from "../impostor-content";

type State = {
  engine: "server-v1";
  game: "impostor";
  locale: "ru" | "en";
  phase: "clue" | "vote" | "reveal" | "finished";
  round: number;
  word: string;
  impostorId: string;
  clues: Record<string, string>;
  votes: Record<string, string>;
  guess: string;
  accusedId: string;
  outcome: string;
  scores: Record<string, number>;
  players: string[];
};

const MAX_ROUNDS = 5;

export default defineGame<State>({
  id: "impostor",
  version: 1,
  createInitialState(participants, config, now = Date.now()) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: "impostor",
      locale,
      phase: "clue",
      round: 0,
      word: IMPOSTOR_WORDS[locale][0],
      impostorId: participants[Math.abs(now) % Math.max(1, participants.length)] ?? "",
      clues: {},
      votes: {},
      guess: "",
      accusedId: "",
      outcome: "",
      scores: {},
      players: participants,
    };
  },
  commandSchemas: {
    clue: z.object({ clue: z.string().trim().min(1).max(80) }).strict(),
    openVote: z.object({}).strict(),
    guess: z.object({ word: z.string().trim().min(1).max(80) }).strict(),
    vote: z.object({ target: z.string().min(1).max(128) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "clue") {
      if (state.phase !== "clue") return { state, changed: false, error: "Clues are closed." };
      if (state.clues[ctx.actorId]) return { state, changed: false };
      return { changed: true, state: { ...state, clues: { ...state.clues, [ctx.actorId]: (payload as { clue: string }).clue.trim() } } };
    }
    if (actionType === "openVote") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "clue") return { state, changed: false, error: "Only the stage can open voting." };
      if (Object.keys(state.clues).length < Math.min(2, ctx.participants.length)) return { state, changed: false, error: "At least two clues are required." };
      return { changed: true, state: { ...state, phase: "vote", votes: {} } };
    }
    if (actionType === "guess") {
      if (state.phase !== "clue" && state.phase !== "vote") return { state, changed: false, error: "The round is already revealed." };
      if (ctx.actorId !== state.impostorId) return { state, changed: false, error: "Only the impostor can guess the word." };
      const guess = (payload as { word: string }).word.trim();
      const correct = guess.toLocaleLowerCase(state.locale) === state.word.toLocaleLowerCase(state.locale);
      if (!correct) return { changed: true, state: { ...state, guess } };
      return { changed: true, state: { ...state, phase: "reveal", guess, outcome: "impostor", scores: { ...state.scores, [state.impostorId]: (state.scores[state.impostorId] ?? 0) + 3 } } };
    }
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state, changed: false, error: "Voting is closed." };
      if (state.votes[ctx.actorId]) return { state, changed: false };
      const targetId = (payload as { target: string }).target;
      if (!ctx.participants.includes(targetId)) return { state, changed: false, error: "Choose a player in this session." };
      return { changed: true, state: { ...state, votes: { ...state.votes, [ctx.actorId]: targetId } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "vote") return { state, changed: false, error: "Only the stage can reveal voting." };
      if (!Object.keys(state.votes).length) return { state, changed: false, error: "No votes to reveal." };
      const tally: Record<string, number> = {};
      Object.values(state.votes).forEach((id) => { tally[id] = (tally[id] ?? 0) + 1; });
      const accusedId = Object.entries(tally).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "";
      const crewWin = accusedId === state.impostorId;
      const scores = { ...state.scores };
      if (crewWin) ctx.participants.filter((id) => id !== state.impostorId).forEach((id) => { scores[id] = (scores[id] ?? 0) + 1; });
      else scores[state.impostorId] = (scores[state.impostorId] ?? 0) + 2;
      return { changed: true, state: { ...state, phase: "reveal", accusedId, outcome: crewWin ? "crew" : "impostor", scores } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "reveal") return { state, changed: false, error: "Only the stage can start the next round." };
      const round = state.round + 1;
      if (round >= MAX_ROUNDS) return { changed: true, state: { ...state, phase: "finished" } };
      return { changed: true, state: { ...state, phase: "clue", round, word: IMPOSTOR_WORDS[state.locale][round % IMPOSTOR_WORDS[state.locale].length], impostorId: ctx.participants[round % ctx.participants.length] ?? "", clues: {}, votes: {}, guess: "", accusedId: "", outcome: "" } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(s) {
    return Math.max(0, ...Object.values(s.scores));
  },
});
