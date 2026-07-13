import { z } from "zod";
import { defineGame } from "../definition";
import { WOULD_RATHER_PROMPTS } from "../would-rather-content";

type Prompt = { a: string; b: string };

type State = {
  engine: "server-v1";
  game: "wouldRather";
  locale: "ru" | "en";
  phase: "vote" | "reveal" | "finished";
  round: number;
  prompt: Prompt;
  votes: Record<string, "a" | "b">;
  players: string[];
};

export default defineGame<State>({
  id: "wouldRather",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: "wouldRather",
      locale,
      phase: "vote",
      round: 0,
      prompt: WOULD_RATHER_PROMPTS[0][locale],
      votes: {},
      players: participants,
    };
  },
  commandSchemas: {
    vote: z.object({ choice: z.enum(["a", "b"]) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state, changed: false, error: "Voting is closed." };
      if (state.votes[ctx.actorId]) return { state, changed: false };
      return { changed: true, state: { ...state, votes: { ...state.votes, [ctx.actorId]: (payload as { choice: "a" | "b" }).choice } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can reveal votes." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...state, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state, changed: false, error: "Reveal the vote first." };
      const round = state.round + 1;
      if (round >= WOULD_RATHER_PROMPTS.length) return { changed: true, state: { ...state, phase: "finished" } };
      return { changed: true, state: { ...state, phase: "vote", round, prompt: WOULD_RATHER_PROMPTS[round][state.locale], votes: {} } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore() {
    return 0;
  },
});
