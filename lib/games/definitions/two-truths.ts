import { z } from "zod";
import { defineGame } from "../definition";
import { TWO_TRUTHS_ROUNDS } from "../two-truths-content";

type State = {
  engine: "server-v1";
  game: "twoTruths";
  locale: "ru" | "en";
  phase: "vote" | "reveal" | "finished";
  round: number;
  statements: string[];
  lie: number;
  votes: Record<string, number>;
  players: string[];
};

export default defineGame<State>({
  id: "twoTruths",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    const content = TWO_TRUTHS_ROUNDS[0];
    return {
      engine: "server-v1",
      game: "twoTruths",
      locale,
      phase: "vote",
      round: 0,
      statements: [...content[locale]],
      lie: content.lie,
      votes: {},
      players: participants,
    };
  },
  commandSchemas: {
    vote: z.object({ index: z.number().int().min(0).max(2) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state, changed: false, error: "Voting is closed." };
      if (state.votes[ctx.actorId] !== undefined) return { state, changed: false };
      return { changed: true, state: { ...state, votes: { ...state.votes, [ctx.actorId]: (payload as { index: number }).index } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can reveal the lie." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...state, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state, changed: false, error: "Reveal the lie first." };
      const round = state.round + 1;
      if (round >= TWO_TRUTHS_ROUNDS.length) return { changed: true, state: { ...state, phase: "finished" } };
      const content = TWO_TRUTHS_ROUNDS[round];
      return { changed: true, state: { ...state, phase: "vote", round, statements: content[state.locale], lie: content.lie, votes: {} } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore() {
    return 0;
  },
});
