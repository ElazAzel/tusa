import { z } from "zod";
import { defineGame } from "../definition";

const words = {
  en: ["Karaoke", "Road trip", "Playlist", "Volcano", "Beshbarmak", "Disco ball"],
  ru: ["Караоке", "Поездка", "Плейлист", "Вулкан", "Бешбармак", "Диско-шар"],
};

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
};

export default defineGame<State>({
  id: "alias",
  version: 1,
  createInitialState(players, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    return {
      engine: "server-v1",
      game: "alias",
      locale,
      phase: "lobby",
      round: 0,
      word: words[locale][0],
      wordIndex: 0,
      deadline: 0,
      score: 0,
      players,
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
      return { changed: true, state: { ...state, phase: "play", deadline: context.now + 60_000 } };
    }
    if (action === "correct" || action === "skip") {
      if (context.actorId !== context.creatorId || state.phase !== "play") return { state, changed: false, error: "Only the stage can control the round." };
      const wordIndex = (state.wordIndex + 1) % words[state.locale].length;
      return {
        changed: true,
        state: {
          ...state,
          wordIndex,
          word: words[state.locale][wordIndex],
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
    return viewer === "__stage__" ? state : { ...state, word: "" };
  },
  deriveScore: (state) => state.score,
});
