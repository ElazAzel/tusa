import { z } from "zod";
import { defineGame } from "../definition";
import { MUSIC_QUIZ_ROUNDS, musicQuizPrompt } from "../music-quiz-content";

type MusicGameId = "guessSong" | "musicQuiz";
type Phase = "clue" | "guess" | "reveal" | "finished";

type State = {
  engine: "server-v1";
  game: MusicGameId;
  locale: "ru" | "en";
  phase: Phase;
  round: number;
  artist: string;
  year: string;
  fact: string;
  answer: string;
  revealedTitle: string;
  deadline: number;
  scores: Record<string, number>;
  guesses: Record<string, string>;
  winner: string;
  players: string[];
};

const CLUE_MS = 6_000;
const GUESS_MS = 12_000;

function roundState(game: MusicGameId, locale: "ru" | "en", round: number, players: string[], now: number): State {
  const prompt = musicQuizPrompt(locale, round);
  return {
    engine: "server-v1",
    game,
    locale,
    phase: "clue",
    round,
    artist: prompt.artist,
    year: prompt.year,
    fact: prompt.fact,
    answer: prompt.answer,
    revealedTitle: "",
    deadline: now + CLUE_MS,
    scores: {},
    guesses: {},
    winner: "",
    players,
  };
}

function normalise(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function createMusicQuizDefinition(id: MusicGameId) {
  return defineGame<State>({
    id,
    version: 1,
    createInitialState(participants, config, now = Date.now()) {
      return roundState(id, config.locale === "en" ? "en" : "ru", 0, participants, now);
    },
    commandSchemas: {
      openGuess: z.object({}).strict(),
      guess: z.object({ title: z.string().trim().min(2).max(120) }).strict(),
      reveal: z.object({}).strict(),
      next: z.object({}).strict(),
    },
    reducer(state, actionType, payload, ctx) {
      if (actionType === "openGuess") {
        if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can open guesses." };
        if (state.phase !== "clue") return { state, changed: false };
        if (ctx.now < state.deadline) return { state, changed: false, error: "The clue is still playing." };
        return { changed: true, state: { ...state, phase: "guess", deadline: ctx.now + GUESS_MS } };
      }
      if (actionType === "guess") {
        if (state.phase !== "guess") return { state, changed: false, error: "Guesses are closed." };
        if (ctx.now > state.deadline) return { state, changed: false, error: "The answer deadline has passed." };
        if (state.guesses[ctx.actorId]) return { state, changed: false };
        const title = String((payload as { title: string }).title);
        const guesses = { ...state.guesses, [ctx.actorId]: title };
        if (normalise(title) !== normalise(state.answer)) return { changed: true, state: { ...state, guesses } };
        const points = state.deadline - ctx.now > GUESS_MS / 2 ? 3 : 1;
        return {
          changed: true,
          state: {
            ...state,
            guesses,
            scores: { ...state.scores, [ctx.actorId]: (state.scores[ctx.actorId] ?? 0) + points },
            winner: ctx.actorId,
            phase: "reveal",
            revealedTitle: state.answer,
          },
        };
      }
      if (actionType === "reveal") {
        if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can reveal an answer." };
        if (state.phase !== "guess") return { state, changed: false };
        if (ctx.now < state.deadline && Object.keys(state.guesses).length < ctx.participants.length) return { state, changed: false, error: "The round is still active." };
        return { changed: true, state: { ...state, phase: "reveal", revealedTitle: state.answer } };
      }
      if (actionType === "next") {
        if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can advance the game." };
        if (state.phase !== "reveal") return { state, changed: false, error: "Reveal the answer first." };
        const round = state.round + 1;
        if (round >= MUSIC_QUIZ_ROUNDS) return { changed: true, state: { ...state, phase: "finished" } };
        const next = roundState(id, state.locale, round, ctx.participants, ctx.now);
        return { changed: true, state: { ...next, scores: state.scores } };
      }
      return { state, changed: false, error: "Unsupported server game command." };
    },
    sanitizeForViewer(state) {
      const visible = { ...state };
      delete (visible as Partial<State>).answer;
      return visible as State;
    },
    deriveScore(state) {
      return Math.max(0, ...Object.values(state.scores));
    },
  });
}

export default createMusicQuizDefinition("guessSong");
