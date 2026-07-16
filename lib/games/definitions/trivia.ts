import { z } from "zod";
import { defineGame } from "../definition";
import { DAILY_TRIVIA } from "../daily-trivia";

type GameVariant = "trivia" | "quiz";
type State = {
  engine: "server-v1";
  game: GameVariant;
  locale: "ru" | "en";
  phase: "question" | "result" | "finished";
  round: number;
  question: string;
  options: string[];
  correct: number;
  deadline: number;
  scores: Record<string, number>;
  answered: Record<string, boolean>;
  players: string[];
};

const ROUNDS = 5;

function question(round: number, locale: "ru" | "en") {
  const q = DAILY_TRIVIA[round % DAILY_TRIVIA.length];
  return { question: q.prompt[locale], options: q.options[locale], correct: q.correct };
}

export function createTriviaDefinition(id: GameVariant, durationMs: number, fastAnswerSeconds: number, fastAnswerPoints = 2) {
  return defineGame<State>({
  id,
  version: 1,
  createInitialState(participants, config, now = Date.now()) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: id,
      locale,
      phase: "question",
      round: 0,
      ...question(0, locale),
      deadline: now + durationMs,
      scores: {},
      answered: {},
      players: participants,
    };
  },
  commandSchemas: {
    answer: z.object({ index: z.number().int().min(0).max(200) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "answer") {
      if (state.phase !== "question") return { state, changed: false, error: "This round is not accepting answers." };
      if (ctx.now > state.deadline) return { state, changed: false, error: "The answer deadline has passed." };
      if (state.answered[ctx.actorId]) return { state, changed: false };
      const answer = Number((payload as { index?: unknown }).index);
      const secondsLeft = Math.max(0, Math.ceil((state.deadline - ctx.now) / 1000));
      const points = answer === state.correct ? (secondsLeft > fastAnswerSeconds ? fastAnswerPoints : 1) : 0;
      return { changed: true, state: { ...state, answered: { ...state.answered, [ctx.actorId]: true }, scores: points ? { ...state.scores, [ctx.actorId]: (state.scores[ctx.actorId] ?? 0) + points } : state.scores } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can reveal an answer." };
      if (state.phase !== "question") return { state, changed: false };
      const everyoneAnswered = ctx.participants.length > 0 && ctx.participants.every((id) => state.answered[id]);
      if (ctx.now < state.deadline && !everyoneAnswered) return { state, changed: false, error: "The round is still active." };
      return { changed: true, state: { ...state, phase: "result" } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "result") return { state, changed: false, error: "Reveal the current answer first." };
      const round = state.round + 1;
      if (round >= ROUNDS) return { changed: true, state: { ...state, phase: "finished" } };
      return { changed: true, state: { ...state, phase: "question", round, ...question(round, state.locale), deadline: ctx.now + durationMs, answered: {} } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(s) {
    return Math.max(0, ...Object.values(s.scores));
  },
  });
}

export default createTriviaDefinition("trivia", 15_000, 8);
