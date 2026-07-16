import { z } from "zod";
import { defineGame } from "../definition";

type WheelState = {
  engine: "server-v1";
  game: "wheel";
  phase: "collect" | "result" | "finished";
  options: string[];
  result: string;
  resultIndex: number;
  angle: number;
  round: number;
  players: string[];
};

type CupState = {
  engine: "server-v1";
  game: "beer";
  phase: "active" | "finished";
  scores: [number, number];
  moves: number;
  players: string[];
};

const wheelDefaults = {
  en: ["Tell a joke", "Make a dance move", "Share a fun fact", "Choose the next song", "Give a compliment", "Take a group photo"],
  ru: ["Расскажи шутку", "Покажи танцевальное движение", "Поделись фактом", "Выбери следующую песню", "Скажи комплимент", "Сделай общее фото"],
};

function wheelIndex(options: string[], round: number, now: number) {
  return Math.abs((round + 1) * 31 + Math.floor(now / 1000)) % options.length;
}

export const wheel = defineGame<WheelState>({
  id: "wheel",
  version: 1,
  createInitialState(participants, config) {
    const locale = config.locale === "en" ? "en" : "ru";
    return { engine: "server-v1", game: "wheel", phase: "collect", options: wheelDefaults[locale], result: "", resultIndex: -1, angle: 0, round: 0, players: participants };
  },
  commandSchemas: {
    addOption: z.object({ text: z.string().trim().min(1).max(60) }).strict(),
    spin: z.object({}).strict(),
    next: z.object({}).strict(),
    finish: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "addOption") {
      if (state.phase !== "collect") return { state, changed: false, error: "Wait for the next round." };
      const text = String((payload as { text: string }).text).trim();
      if (state.options.some((option) => option.localeCompare(text, undefined, { sensitivity: "accent" }) === 0)) return { state, changed: false, error: "That option is already on the wheel." };
      if (state.options.length >= 24) return { state, changed: false, error: "The wheel already has the maximum number of options." };
      return { changed: true, state: { ...state, options: [...state.options, text] } };
    }
    if (actionType === "spin") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can spin the wheel." };
      if (state.phase !== "collect" || state.options.length < 2) return { state, changed: false, error: "Add at least two options first." };
      const resultIndex = wheelIndex(state.options, state.round, ctx.now);
      const segment = 360 / state.options.length;
      return { changed: true, state: { ...state, phase: "result", resultIndex, result: state.options[resultIndex], angle: state.angle + 1800 + (360 - resultIndex * segment - segment / 2) } };
    }
    if (actionType === "next") {
      if (ctx.actorId !== ctx.creatorId || state.phase !== "result") return { state, changed: false, error: "Only the stage can start the next spin." };
      return { changed: true, state: { ...state, phase: "collect", result: "", resultIndex: -1, round: state.round + 1 } };
    }
    if (actionType === "finish") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can finish the wheel." };
      return { changed: true, state: { ...state, phase: "finished" } };
    }
    return { state, changed: false, error: "Unsupported server game command." };
  },
  deriveScore(state) { return state.round + (state.phase === "result" ? 1 : 0); },
});

export const cupToss = defineGame<CupState>({
  id: "beer",
  version: 1,
  createInitialState(participants) {
    return { engine: "server-v1", game: "beer", phase: "active", scores: [10, 10], moves: 0, players: participants };
  },
  commandSchemas: {
    hit: z.object({ team: z.union([z.literal(0), z.literal(1)]) }).strict(),
    returnCup: z.object({ team: z.union([z.literal(0), z.literal(1)]) }).strict(),
    finish: z.object({}).strict(),
  },
  reducer(state, actionType, payload, ctx) {
    if (actionType === "finish") {
      if (ctx.actorId !== ctx.creatorId) return { state, changed: false, error: "Only the stage can finish the match." };
      return { changed: true, state: { ...state, phase: "finished" } };
    }
    if (state.phase !== "active") return { state, changed: false, error: "The match is finished." };
    if (!ctx.participants.includes(ctx.actorId)) return { state, changed: false, error: "Join the game before recording a cup." };
    const team = (payload as { team: 0 | 1 }).team;
    const delta = actionType === "hit" ? -1 : actionType === "returnCup" ? 1 : 0;
    if (!delta) return { state, changed: false, error: "Unsupported server game command." };
    const scores: [number, number] = [...state.scores] as [number, number];
    scores[team] = Math.max(0, Math.min(10, scores[team] + delta));
    if (scores[team] === state.scores[team]) return { state, changed: false };
    return { changed: true, state: { ...state, scores, moves: state.moves + 1, phase: scores.includes(0) ? "finished" : "active" } };
  },
  deriveScore(state) { return 20 - state.scores[0] - state.scores[1]; },
});
