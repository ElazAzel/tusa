import { z } from "zod";
import { defineGame } from "../definition";
import { PICK_THREE_SETS } from "../pick-three-content";

type State = {
  engine: "server-v1";
  game: "kissMarry";
  locale: "ru" | "en";
  phase: "vote" | "reveal" | "finished";
  round: number;
  names: string[];
  votes: Record<string, [number, number, number]>;
  players: string[];
};

const assignmentSchema = z.object({ assignment: z.array(z.number().int().min(0).max(2)).length(3).refine((value) => new Set(value).size === 3, "Each action must be used once.") }).strict();

export default defineGame<State>({
  id: "kissMarry",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    return { engine: "server-v1", game: "kissMarry", locale, phase: "vote", round: 0, names: [...PICK_THREE_SETS[0]], votes: {}, players: participants };
  },
  commandSchemas: { vote: assignmentSchema, reveal: z.object({}).strict(), next: z.object({}).strict() },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state, changed: false, error: "Voting is closed." };
      if (state.votes[ctx.actorId]) return { state, changed: false };
      const assignment = (payload as { assignment: [number, number, number] }).assignment;
      if (!Array.isArray(assignment) || assignment.length !== 3 || new Set(assignment).size !== 3 || assignment.some((value) => !Number.isInteger(value) || value < 0 || value > 2)) return { state, changed: false, error: "Assign each action exactly once." };
      return { changed: true, state: { ...state, votes: { ...state.votes, [ctx.actorId]: assignment } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can reveal results." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...state, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state, changed: false, error: "Reveal the results first." };
      const round = state.round + 1;
      if (round >= PICK_THREE_SETS.length) return { changed: true, state: { ...state, phase: "finished" } };
      return { changed: true, state: { ...state, phase: "vote", round, names: [...PICK_THREE_SETS[round]], votes: {}, players: ctx.participants } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore() { return 0; },
});
