import { DAILY_TRIVIA } from "./daily-trivia";
import { WOULD_RATHER_PROMPTS } from "./would-rather-content";

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
  game: "trivia" | "quiz";
};

const TRIVIA_ROUNDS = 5;

function triviaQuestion(round: number, locale: "ru" | "en") {
  const question = DAILY_TRIVIA[round % DAILY_TRIVIA.length];
  return { question: question.prompt[locale], options: question.options[locale], correct: question.correct };
}

export function initialServerGameState(gameId: string, participants: string[], config: Record<string, unknown>, now = Date.now()): Record<string, unknown> | null {
  const locale = config.locale === "en" ? "en" : "ru";
  if (gameId === "wouldRather") return { engine: "server-v1", game: "wouldRather", locale, phase: "vote", round: 0, prompt: WOULD_RATHER_PROMPTS[0][locale], votes: {}, players: participants };
  if (gameId !== "trivia" && gameId !== "quiz") return null;
  const game = gameId;
  return { engine: "server-v1", game, locale, phase: "question", round: 0, ...triviaQuestion(0, locale), deadline: now + (game === "quiz" ? 12_000 : 15_000), scores: {}, answered: {}, players: participants } satisfies TriviaState & { players: string[] };
}

export function applyServerGameCommand(gameId: string, rawState: Record<string, unknown>, actionType: string, payload: unknown, context: ServerGameContext): ServerGameResult | null {
  if (gameId === "wouldRather" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "vote" | "reveal" | "finished"; round: number; locale: "ru" | "en"; votes: Record<string, "a" | "b"> };
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state: rawState, changed: false, error: "Voting is closed." };
      if (state.votes[context.actorId]) return { state: rawState, changed: false };
      const choice = (payload as { choice: "a" | "b" }).choice;
      return { changed: true, state: { ...rawState, votes: { ...state.votes, [context.actorId]: choice } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal votes." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state: rawState, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...rawState, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state: rawState, changed: false, error: "Reveal the vote first." };
      const round = state.round + 1;
      if (round >= WOULD_RATHER_PROMPTS.length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "vote", round, prompt: WOULD_RATHER_PROMPTS[round][state.locale], votes: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if ((gameId !== "trivia" && gameId !== "quiz") || rawState.engine !== "server-v1") return null;
  const state = rawState as unknown as TriviaState;
  if (actionType === "answer") {
    if (state.phase !== "question") return { state: rawState, changed: false, error: "This round is not accepting answers." };
    if (context.now > state.deadline) return { state: rawState, changed: false, error: "The answer deadline has passed." };
    if (state.answered[context.actorId]) return { state: rawState, changed: false };
    const answer = Number((payload as { index?: unknown }).index);
    const secondsLeft = Math.max(0, Math.ceil((state.deadline - context.now) / 1000));
    const fastThreshold = state.game === "quiz" ? 6 : 8;
    const points = answer === state.correct ? (secondsLeft > fastThreshold ? (state.game === "quiz" ? 3 : 2) : 1) : 0;
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
    return { changed: true, state: { ...state, phase: "question", round, ...triviaQuestion(round, state.locale), deadline: context.now + (state.game === "quiz" ? 12_000 : 15_000), answered: {} } };
  }
  return { state: rawState, changed: false, error: "Unsupported server game command." };
}

export function isServerGameState(state: Record<string, unknown>) { return state.engine === "server-v1"; }
