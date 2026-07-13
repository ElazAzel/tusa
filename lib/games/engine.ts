import { DAILY_TRIVIA } from "./daily-trivia";
import { WOULD_RATHER_PROMPTS } from "./would-rather-content";
import { TWO_TRUTHS_ROUNDS } from "./two-truths-content";
import { PICK_THREE_SETS } from "./pick-three-content";
import { BRAIN_BURST_QUESTIONS } from "./brain-burst-content";
import { SAME_WORD_PROMPTS } from "./same-word-content";
import { WORD_BOMB_LETTERS } from "./word-bomb-content";
import { SPECTRUM_PAIRS } from "./spectrum-content";

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
  game: "trivia" | "quiz" | "brainBurst";
};

const TRIVIA_ROUNDS = 5;

function triviaQuestion(round: number, locale: "ru" | "en") {
  const question = DAILY_TRIVIA[round % DAILY_TRIVIA.length];
  return { question: question.prompt[locale], options: question.options[locale], correct: question.correct };
}

function brainBurstQuestion(round: number, locale: "ru" | "en") {
  const question = BRAIN_BURST_QUESTIONS[round % BRAIN_BURST_QUESTIONS.length];
  return { question: question.prompt[locale], options: question.options[locale], correct: question.correct };
}

export function initialServerGameState(gameId: string, participants: string[], config: Record<string, unknown>, now = Date.now()): Record<string, unknown> | null {
  const locale = config.locale === "en" ? "en" : "ru";
  if (gameId === "wouldRather") return { engine: "server-v1", game: "wouldRather", locale, phase: "vote", round: 0, prompt: WOULD_RATHER_PROMPTS[0][locale], votes: {}, players: participants };
  if (gameId === "twoTruths") return { engine: "server-v1", game: "twoTruths", locale, phase: "vote", round: 0, statements: TWO_TRUTHS_ROUNDS[0][locale], lie: TWO_TRUTHS_ROUNDS[0].lie, votes: {}, players: participants };
  if (gameId === "kissMarry") return { engine: "server-v1", game: "kissMarry", locale, phase: "vote", round: 0, names: PICK_THREE_SETS[0], votes: {}, players: participants };
  if (gameId === "brainBurst") return { engine: "server-v1", game: "brainBurst", locale, phase: "question", round: 0, ...brainBurstQuestion(0, locale), deadline: now + 10_000, scores: {}, answered: {}, players: participants };
  if (gameId === "blankSlate") return { engine: "server-v1", game: "blankSlate", locale, phase: "write", round: 0, prompt: SAME_WORD_PROMPTS[locale][0], submissions: {}, roundMatches: 0, totalMatches: 0, players: participants };
  if (gameId === "bombParty") return { engine: "server-v1", game: "bombParty", locale, phase: "play", round: 0, letter: WORD_BOMB_LETTERS[locale][0], deadline: now + 20_000, submissions: {}, usedWords: [], eliminated: [], players: participants };
  if (gameId === "wavelength") return { engine: "server-v1", game: "wavelength", locale, phase: "clue", round: 0, pair: SPECTRUM_PAIRS[locale][0], target: (Math.abs(now) % 10) + 1, clue: "", guesses: {}, teamScore: 0, roundScore: 0, players: participants };
  if (gameId !== "trivia" && gameId !== "quiz") return null;
  const game = gameId;
  return { engine: "server-v1", game, locale, phase: "question", round: 0, ...triviaQuestion(0, locale), deadline: now + (game === "quiz" ? 12_000 : 15_000), scores: {}, answered: {}, players: participants } satisfies TriviaState & { players: string[] };
}

export function applyServerGameCommand(gameId: string, rawState: Record<string, unknown>, actionType: string, payload: unknown, context: ServerGameContext): ServerGameResult | null {
  if (gameId === "wavelength" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "clue" | "guess" | "reveal" | "finished"; round: number; locale: "ru" | "en"; target: number; guesses: Record<string, number>; teamScore: number };
    if (actionType === "clue") {
      if (context.actorId !== context.creatorId || state.phase !== "clue") return { state: rawState, changed: false, error: "Only the stage can submit the clue." };
      const clue = (payload as { text: string }).text.trim();
      return { changed: true, state: { ...rawState, phase: "guess", clue } };
    }
    if (actionType === "guess") {
      if (state.phase !== "guess") return { state: rawState, changed: false, error: "Guessing is closed." };
      if (context.actorId === context.creatorId) return { state: rawState, changed: false, error: "The clue giver cannot guess." };
      if (state.guesses[context.actorId] !== undefined) return { state: rawState, changed: false };
      return { changed: true, state: { ...rawState, guesses: { ...state.guesses, [context.actorId]: (payload as { value: number }).value } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId || state.phase !== "guess") return { state: rawState, changed: false, error: "Only the stage can reveal the target." };
      const guesses = Object.values(state.guesses);
      if (!guesses.length) return { state: rawState, changed: false, error: "No guesses to reveal." };
      const average = guesses.reduce((sum, value) => sum + value, 0) / guesses.length;
      const distance = Math.abs(average - state.target);
      const roundScore = distance <= .5 ? 4 : distance <= 1.5 ? 3 : distance <= 2.5 ? 2 : distance <= 3.5 ? 1 : 0;
      return { changed: true, state: { ...rawState, phase: "reveal", average, roundScore, teamScore: state.teamScore + roundScore } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId || state.phase !== "reveal") return { state: rawState, changed: false, error: "Only the stage can advance after reveal." };
      const round = state.round + 1;
      if (round >= SPECTRUM_PAIRS[state.locale].length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "clue", round, pair: SPECTRUM_PAIRS[state.locale][round], target: ((state.target + round * 3) % 10) + 1, clue: "", guesses: {}, roundScore: 0, average: null } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "bombParty" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "play" | "result" | "finished"; round: number; locale: "ru" | "en"; letter: string; deadline: number; submissions: Record<string, string>; usedWords: string[]; eliminated: string[] };
    const alive = context.participants.filter((id) => !state.eliminated.includes(id));
    if (actionType === "submit") {
      if (state.phase !== "play" || context.now > state.deadline) return { state: rawState, changed: false, error: "This round is closed." };
      if (!alive.includes(context.actorId)) return { state: rawState, changed: false, error: "Eliminated players cannot submit." };
      if (state.submissions[context.actorId]) return { state: rawState, changed: false };
      const word = (payload as { word: string }).word.trim().replace(/\s+/g, " ");
      const normalized = word.toLocaleLowerCase(state.locale);
      if (word.length < 2 || !word.toLocaleUpperCase(state.locale).startsWith(state.letter)) return { state: rawState, changed: false, error: `The word must start with ${state.letter}.` };
      if (state.usedWords.includes(normalized) || Object.values(state.submissions).some((value) => value.toLocaleLowerCase(state.locale) === normalized)) return { state: rawState, changed: false, error: "That word was already used." };
      return { changed: true, state: { ...rawState, submissions: { ...state.submissions, [context.actorId]: word } } };
    }
    if (actionType === "finalize") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can close the round." };
      const everyoneAnswered = alive.length > 0 && alive.every((id) => state.submissions[id]);
      if (state.phase !== "play" || (context.now < state.deadline && !everyoneAnswered)) return { state: rawState, changed: false, error: "The round is still active." };
      const eliminated = [...new Set([...state.eliminated, ...alive.filter((id) => !state.submissions[id])])];
      const usedWords = [...state.usedWords, ...Object.values(state.submissions).map((word) => word.toLocaleLowerCase(state.locale))];
      return { changed: true, state: { ...rawState, phase: "result", eliminated, usedWords } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "result") return { state: rawState, changed: false, error: "Close the current round first." };
      const survivors = context.participants.filter((id) => !state.eliminated.includes(id));
      const round = state.round + 1;
      if (survivors.length <= 1 || round >= WORD_BOMB_LETTERS[state.locale].length) return { changed: true, state: { ...rawState, phase: "finished", winner: survivors[0] ?? null } };
      return { changed: true, state: { ...rawState, phase: "play", round, letter: WORD_BOMB_LETTERS[state.locale][round], deadline: context.now + 20_000, submissions: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "blankSlate" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "write" | "reveal" | "finished"; round: number; locale: "ru" | "en"; submissions: Record<string, string>; totalMatches: number };
    if (actionType === "submit") {
      if (state.phase !== "write") return { state: rawState, changed: false, error: "Submissions are closed." };
      if (state.submissions[context.actorId]) return { state: rawState, changed: false };
      const answer = (payload as { answer: string }).answer.trim().replace(/\s+/g, " ");
      return { changed: true, state: { ...rawState, submissions: { ...state.submissions, [context.actorId]: answer } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal answers." };
      if (state.phase !== "write" || Object.keys(state.submissions).length === 0) return { state: rawState, changed: false, error: "No answers to reveal." };
      const counts = Object.values(state.submissions).reduce<Record<string, number>>((all, answer) => { const key = answer.toLocaleLowerCase(state.locale); all[key] = (all[key] ?? 0) + 1; return all; }, {});
      const roundMatches = Object.values(counts).filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
      return { changed: true, state: { ...rawState, phase: "reveal", roundMatches, totalMatches: state.totalMatches + roundMatches } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state: rawState, changed: false, error: "Reveal answers first." };
      const round = state.round + 1;
      if (round >= SAME_WORD_PROMPTS[state.locale].length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "write", round, prompt: SAME_WORD_PROMPTS[state.locale][round], submissions: {}, roundMatches: 0 } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "kissMarry" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "vote" | "reveal" | "finished"; round: number; votes: Record<string, number[]> };
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state: rawState, changed: false, error: "Voting is closed." };
      if (state.votes[context.actorId]) return { state: rawState, changed: false };
      const assignment = (payload as { assignment: number[] }).assignment;
      if (assignment.length !== 3 || new Set(assignment).size !== 3) return { state: rawState, changed: false, error: "Assign each action exactly once." };
      return { changed: true, state: { ...rawState, votes: { ...state.votes, [context.actorId]: assignment } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal results." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state: rawState, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...rawState, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state: rawState, changed: false, error: "Reveal the results first." };
      const round = state.round + 1;
      if (round >= PICK_THREE_SETS.length) return { changed: true, state: { ...rawState, phase: "finished" } };
      return { changed: true, state: { ...rawState, phase: "vote", round, names: PICK_THREE_SETS[round], votes: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
  if (gameId === "twoTruths" && rawState.engine === "server-v1") {
    const state = rawState as { phase: "vote" | "reveal" | "finished"; round: number; locale: "ru" | "en"; votes: Record<string, number> };
    if (actionType === "vote") {
      if (state.phase !== "vote") return { state: rawState, changed: false, error: "Voting is closed." };
      if (state.votes[context.actorId] !== undefined) return { state: rawState, changed: false };
      const index = (payload as { index: number }).index;
      return { changed: true, state: { ...rawState, votes: { ...state.votes, [context.actorId]: index } } };
    }
    if (actionType === "reveal") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can reveal the lie." };
      if (state.phase !== "vote" || Object.keys(state.votes).length === 0) return { state: rawState, changed: false, error: "No votes to reveal." };
      return { changed: true, state: { ...rawState, phase: "reveal" } };
    }
    if (actionType === "next") {
      if (context.actorId !== context.creatorId) return { state: rawState, changed: false, error: "Only the stage can advance the game." };
      if (state.phase !== "reveal") return { state: rawState, changed: false, error: "Reveal the lie first." };
      const round = state.round + 1;
      if (round >= TWO_TRUTHS_ROUNDS.length) return { changed: true, state: { ...rawState, phase: "finished" } };
      const content = TWO_TRUTHS_ROUNDS[round];
      return { changed: true, state: { ...rawState, phase: "vote", round, statements: content[state.locale], lie: content.lie, votes: {} } };
    }
    return { state: rawState, changed: false, error: "Unsupported server game command." };
  }
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
  if ((gameId !== "trivia" && gameId !== "quiz" && gameId !== "brainBurst") || rawState.engine !== "server-v1") return null;
  const state = rawState as unknown as TriviaState;
  if (actionType === "answer") {
    if (state.phase !== "question") return { state: rawState, changed: false, error: "This round is not accepting answers." };
    if (context.now > state.deadline) return { state: rawState, changed: false, error: "The answer deadline has passed." };
    if (state.answered[context.actorId]) return { state: rawState, changed: false };
    const answer = Number((payload as { index?: unknown }).index);
    const secondsLeft = Math.max(0, Math.ceil((state.deadline - context.now) / 1000));
    const fastThreshold = state.game === "quiz" ? 6 : state.game === "brainBurst" ? 5 : 8;
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
    const rounds = state.game === "brainBurst" ? BRAIN_BURST_QUESTIONS.length : TRIVIA_ROUNDS;
    if (round >= rounds) return { changed: true, state: { ...state, phase: "finished" } };
    const content = state.game === "brainBurst" ? brainBurstQuestion(round, state.locale) : triviaQuestion(round, state.locale);
    const duration = state.game === "brainBurst" ? 10_000 : state.game === "quiz" ? 12_000 : 15_000;
    return { changed: true, state: { ...state, phase: "question", round, ...content, deadline: context.now + duration, answered: {} } };
  }
  return { state: rawState, changed: false, error: "Unsupported server game command." };
}

export function isServerGameState(state: Record<string, unknown>) { return state.engine === "server-v1"; }
