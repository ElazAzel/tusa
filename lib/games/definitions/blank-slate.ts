import { z } from "zod";
import { defineGame } from "../definition";
import { SAME_WORD_PROMPTS } from "../same-word-content";

type State = {
  engine: "server-v1";
  game: "blankSlate";
  locale: "ru" | "en";
  phase: "write" | "reveal" | "finished";
  round: number;
  prompt: string;
  submissions: Record<string, string>;
  roundMatches: number;
  totalMatches: number;
  players: string[];
};

function promptFor(round: number, locale: "ru" | "en") {
  return SAME_WORD_PROMPTS[locale][round % SAME_WORD_PROMPTS[locale].length];
}

function matchedAnswers(submissions: Record<string, string>, locale: "ru" | "en") {
  const counts = Object.values(submissions).reduce<Record<string, number>>((all, answer) => {
    const key = answer.toLocaleLowerCase(locale);
    all[key] = (all[key] ?? 0) + 1;
    return all;
  }, {});
  return Object.values(counts).filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
}

export default defineGame<State>({
  id: "blankSlate",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: "blankSlate",
      locale,
      phase: "write",
      round: 0,
      prompt: promptFor(0, locale),
      submissions: {},
      roundMatches: 0,
      totalMatches: 0,
      players: participants,
    };
  },
  commandSchemas: {
    submit: z.object({ answer: z.string().trim().min(1).max(40) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "submit") {
      if (state.phase !== "write") return { state, changed: false, error: "Submissions are closed." };
      if (state.submissions[ctx.actorId]) return { state, changed: false };
      const answer = (payload as { answer: string }).answer.trim().replace(/\s+/g, " ");
      return { changed: true, state: { ...state, submissions: { ...state.submissions, [ctx.actorId]: answer } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can reveal answers." };
      if (state.phase !== "write" || !Object.keys(state.submissions).length) return { state, changed: false, error: "No answers to reveal." };
      const roundMatches = matchedAnswers(state.submissions, state.locale);
      return { changed: true, state: { ...state, phase: "reveal", roundMatches, totalMatches: state.totalMatches + roundMatches } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state, changed: false, error: "Reveal answers first." };
      const round = state.round + 1;
      if (round >= SAME_WORD_PROMPTS[state.locale].length) return { changed: true, state: { ...state, phase: "finished" } };
      return { changed: true, state: { ...state, phase: "write", round, prompt: promptFor(round, state.locale), submissions: {}, roundMatches: 0 } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(state) {
    return state.totalMatches;
  },
});
