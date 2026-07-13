import { z } from "zod";
import { defineGame } from "../definition";
import { PUNCHLINE_PROMPTS } from "../punchline-content";

type State = {
  engine: "server-v1";
  game: "quiplash";
  locale: "ru" | "en";
  phase: "answer" | "vote" | "reveal" | "finished";
  round: number;
  prompt: string;
  submissions: Record<string, string>;
  votes: Record<string, string>;
  scores: Record<string, number>;
  players: string[];
};

export default defineGame<State>({
  id: "quiplash",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: "quiplash",
      locale,
      phase: "answer",
      round: 0,
      prompt: PUNCHLINE_PROMPTS[locale][0],
      submissions: {},
      votes: {},
      scores: {},
      players: participants,
    };
  },
  commandSchemas: {
    answer: z.object({ text: z.string().trim().min(1).max(160) }).strict(),
    openVote: z.object({}).strict(),
    vote: z.object({ target: z.string().min(1).max(128) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "answer") {
      if (state.phase !== "answer") return { state, changed: false, error: "Answers are closed." };
      if (state.submissions[ctx.actorId]) return { state, changed: false };
      return { changed: true, state: { ...state, submissions: { ...state.submissions, [ctx.actorId]: (payload as { text: string }).text.trim() } } };
    }
    if (actionType === "openVote") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "answer") return { state, changed: false, error: "Only the stage can open voting." };
      if (Object.keys(state.submissions).length < 2) return { state, changed: false, error: "At least two answers are required." };
      return { changed: true, state: { ...state, phase: "vote" } };
    }
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state, changed: false, error: "Voting is closed." };
      if (state.votes[ctx.actorId]) return { state, changed: false };
      const targetId = (payload as { target: string }).target;
      if (!state.submissions[targetId] || targetId === ctx.actorId) return { state, changed: false, error: "Choose another player's answer." };
      return { changed: true, state: { ...state, votes: { ...state.votes, [ctx.actorId]: targetId } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "vote") return { state, changed: false, error: "Only the stage can reveal votes." };
      if (!Object.keys(state.votes).length) return { state, changed: false, error: "No votes to reveal." };
      const scores = { ...state.scores };
      Object.values(state.votes).forEach((id) => { scores[id] = (scores[id] ?? 0) + 100; });
      return { changed: true, state: { ...state, phase: "reveal", scores } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "reveal") return { state, changed: false, error: "Only the stage can advance after reveal." };
      const round = state.round + 1;
      if (round >= PUNCHLINE_PROMPTS[state.locale].length) return { changed: true, state: { ...state, phase: "finished" } };
      return { changed: true, state: { ...state, phase: "answer", round, prompt: PUNCHLINE_PROMPTS[state.locale][round], submissions: {}, votes: {} } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(s) {
    return Math.max(0, ...Object.values(s.scores));
  },
});
