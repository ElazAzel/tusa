import { z } from "zod";
import { defineGame } from "../definition";
import { SPECTRUM_PAIRS } from "../spectrum-content";
import { deckIndex, deckItem, deckOf, initialDeck, type DeckState } from "../content-deck";

export const SPECTRUM_ROUNDS = 6;

type State = {
  engine: "server-v1";
  game: "wavelength";
  locale: "ru" | "en";
  phase: "clue" | "guess" | "reveal" | "finished";
  round: number;
  pair: string[];
  target: number;
  clue: string;
  guesses: Record<string, number>;
  average: number | null;
  roundScore: number;
  teamScore: number;
  players: string[];
} & DeckState;

function targetFor(round: number, deck: { deckSeed?: string; deckStart?: number }) {
  const source = deckOf(deck);
  return deckIndex(10, { deckSeed: `${source.deckSeed}:target:${source.deckStart}:${round}`, deckStart: 0 }, 0) + 1;
}

function pairFor(round: number, locale: "ru" | "en", deck: { deckSeed?: string; deckStart?: number }) {
  return [...deckItem(SPECTRUM_PAIRS[locale], deckOf(deck), round)];
}

export default defineGame<State>({
  id: "wavelength",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    const deck = initialDeck(config, "wavelength");
    return {
      ...deck,
      engine: "server-v1",
      game: "wavelength",
      locale,
      phase: "clue",
      round: 0,
      pair: pairFor(0, locale, deck),
      target: targetFor(0, deck),
      clue: "",
      guesses: {},
      average: null,
      roundScore: 0,
      teamScore: 0,
      players: participants,
    };
  },
  commandSchemas: {
    clue: z.object({ text: z.string().trim().min(1).max(100) }).strict(),
    guess: z.object({ value: z.number().int().min(1).max(10) }).strict(),
    reveal: z.object({}).strict(),
    next: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "clue") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "clue") return { state, changed: false, error: "Only the stage can submit the clue." };
      return { changed: true, state: { ...state, phase: "guess", clue: (payload as { text: string }).text } };
    }
    if (actionType === "guess") {
      if (state.phase !== "guess") return { state, changed: false, error: "Guessing is closed." };
      if (ctx.actorId === ctx.creatorId) return { state, changed: false, error: "The clue giver cannot guess." };
      if (state.guesses[ctx.actorId] !== undefined) return { state, changed: false };
      return { changed: true, state: { ...state, guesses: { ...state.guesses, [ctx.actorId]: (payload as { value: number }).value } } };
    }
    if (actionType === "reveal") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "guess") return { state, changed: false, error: "Only the stage can reveal the target." };
      const guesses = Object.values(state.guesses);
      if (!guesses.length) return { state, changed: false, error: "No guesses to reveal." };
      const average = guesses.reduce((sum, value) => sum + value, 0) / guesses.length;
      const distance = Math.abs(average - state.target);
      const roundScore = distance <= 0.5 ? 4 : distance <= 1.5 ? 3 : distance <= 2.5 ? 2 : distance <= 3.5 ? 1 : 0;
      return { changed: true, state: { ...state, phase: "reveal", average, roundScore, teamScore: state.teamScore + roundScore } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "reveal") return { state, changed: false, error: "Only the stage can advance after reveal." };
      const round = state.round + 1;
      if (round >= SPECTRUM_ROUNDS) return { changed: true, state: { ...state, phase: "finished" } };
      return {
        changed: true,
        state: {
          ...state,
          phase: "clue",
          round,
          pair: pairFor(round, state.locale, state),
          target: targetFor(round, state),
          contentUsed: round + 1,
          clue: "",
          guesses: {},
          average: null,
          roundScore: 0,
        },
      };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(state) {
    return state.teamScore;
  },
});
