import { DAILY_TRIVIA } from "./daily-trivia";

export type ServerGameContext = { actorId: string; creatorId: string; participants: string[]; now: number };
export type ServerGameResult = { state: Record<string, unknown>; changed: boolean; error?: string };

type TriviaState = {
  engine: "server-v1";
  locale: "ru" | "en";
  phase: "question" | "result" | "finished";
  round: number;
  question: string;
  options: string[];
  correct: number;
  deadline: number;
  scores: Record<string, number>;
  answered: Record<string, boolean>;
};

const TRIVIA_ROUNDS = 5;

function triviaQuestion(round: number, locale: "ru" | "en") {
  const question = DAILY_TRIVIA[round % DAILY_TRIVIA.length];
  return { question: question.prompt[locale], options: question.options[locale], correct: question.correct };
}

export function initialServerGameState(gameId: string, participants: string[], config: Record<string, unknown>, now = Date.now()) {
  if (gameId !== "trivia") return null;
  const locale = config.locale === "en" ? "en" : "ru";
  return { engine: "server-v1", locale, phase: "question", round: 0, ...triviaQuestion(0, locale), deadline: now + 15_000, scores: {}, answered: {}, players: participants } satisfies TriviaState & { players: string[] };
}

export function applyServerGameCommand(gameId: string, rawState: Record<string, unknown>, actionType: string, payload: unknown, context: ServerGameContext): ServerGameResult | null {
  if (gameId !== "trivia" || rawState.engine !== "server-v1") return null;
  const state = rawState as unknown as TriviaState;
  if (actionType === "answer") {
    if (state.phase !== "question") return { state: rawState, changed: false, error: "This round is not accepting answers." };
    if (context.now > state.deadline) return { state: rawState, changed: false, error: "The answer deadline has passed." };
    if (state.answered[context.actorId]) return { state: rawState, changed: false };
    const answer = Number((payload as { index?: unknown }).index);
    const secondsLeft = Math.max(0, Math.ceil((state.deadline - context.now) / 1000));
    const points = answer === state.correct ? (secondsLeft > 8 ? 2 : 1) : 0;
    return { changed: true, state: { ...state, answered: { ...state.answered, [context.actorId]: true }, scores: points ? { ...state.scores, [context.actorId]: (state.scores[context.actorId] ?? 0) + points } : state.scores } };
  }
  if (actionType === "reveal") {
    if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal an answer." };
    if (state.phase !== "question") return { state: rawState, changed: false };
    const everyoneAnswered = context.participants.length > 0 && context.participants.every((id) => state.answered[id]);
    if (context.now < state.deadline && !everyoneAnswered) return { state: rawState, changed: false, error: "The round is still active." };
    return { changed: true, state: { ...state, phase: "result" } };
  }
  if (actionType === "next") {
    if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
    if (state.phase !== "result") return { state: rawState, changed: false, error: "Reveal the current answer first." };
    const round = state.round + 1;
    if (round >= TRIVIA_ROUNDS) return { changed: true, state: { ...state, phase: "finished" } };
    return { changed: true, state: { ...state, phase: "question", round, ...triviaQuestion(round, state.locale), deadline: context.now + 15_000, answered: {} } };
  }
  return { state: rawState, changed: false, error: "Unsupported server game command." };
}

export function isServerGameState(state: Record<string, unknown>) { return state.engine === "server-v1"; }
