import { z } from "zod";
import { defineGame } from "../definition";
import { deckItem, readDeck } from "../content-deck";
import { ALIAS_WORDS_EN } from "../content/alias-en";
import { ALIAS_WORDS_RU } from "../content/alias-ru";

const words = { en: ALIAS_WORDS_EN, ru: ALIAS_WORDS_RU };

function wordAt(state: Pick<State, "locale" | "deckSeed" | "deckStart">, position: number) {
  return deckItem(words[state.locale], { deckSeed: state.deckSeed, deckStart: state.deckStart }, position);
}

type State = {
  engine: "server-v1";
  game: "alias";
  locale: "ru" | "en";
  phase: "lobby" | "play" | "finished";
  round: number;
  word: string;
  wordIndex: number;
  deadline: number;
  score: number;
  players: string[];
  deckSeed: string;
  deckStart: number;
  contentUsed: number;
};

export default defineGame<State>({
  id: "alias",
  version: 1,
  createInitialState(players, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    const deck = readDeck(config, "alias");
    return {
      engine: "server-v1",
      game: "alias",
      locale,
      phase: "lobby",
      round: 0,
      word: wordAt({ locale, ...deck }, 0),
      wordIndex: 0,
      deadline: 0,
      score: 0,
      players,
      ...deck,
      contentUsed: 1,
    };
  },
  commandSchemas: {
    start: z.object({}).strict(),
    correct: z.object({}).strict(),
    skip: z.object({}).strict(),
    finish: z.object({}).strict(),
  },
  reducer(state, action, _payload, context) {
    if (action === "start") {
      if (context.actorId !== context.creatorId) return { state, changed: false, error: "Only the stage can start." };
      if (state.phase !== "lobby" && state.phase !== "finished") return { state, changed: false };
      const wordIndex = state.phase === "finished" ? state.wordIndex + 1 : state.wordIndex;
      return { changed: true, state: { ...state, phase: "play", round: state.phase === "finished" ? state.round + 1 : state.round, wordIndex, word: wordAt(state, wordIndex), contentUsed: wordIndex + 1, deadline: context.now + 60_000 } };
    }
    if (action === "correct" || action === "skip") {
      if (context.actorId !== context.creatorId || state.phase !== "play") return { state, changed: false, error: "Only the stage can control the round." };
      if (context.now > state.deadline + 2_000) return { state, changed: false, error: "The round is over." };
      const wordIndex = state.wordIndex + 1;
      return {
        changed: true,
        state: {
          ...state,
          wordIndex,
          word: wordAt(state, wordIndex),
          contentUsed: wordIndex + 1,
          score: action === "correct" ? state.score + 1 : state.score,
        },
      };
    }
    if (action === "finish") {
      if (context.actorId !== context.creatorId) return { state, changed: false, error: "Only the stage can finish." };
      return { changed: true, state: { ...state, phase: "finished" } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  sanitizeForViewer(state, viewer) {
    const { deckSeed: _seed, deckStart: _start, ...visible } = state;
    void _seed; void _start;
    return (viewer === "__stage__" ? visible : { ...visible, word: "" }) as State;
  },
  deriveScore: (state) => state.score,
});
