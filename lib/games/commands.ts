import { z } from "zod";

const empty = z.object({}).strict();
const index = z.object({ index: z.number().int().min(0).max(200) }).strict();
const target = z.object({ target: z.string().min(1).max(128) }).strict();
const text = (key: string, max = 240) => z.object({ [key]: z.string().trim().min(1).max(max) }).strict();
const point = z.object({ x: z.number().int().min(0).max(600), y: z.number().int().min(0).max(600), draw: z.boolean() }).strict();

const COMMANDS: Record<string, Record<string, z.ZodType>> = {
  blankSlate: { submit: text("answer", 40), reveal: empty, next: empty },
  bombParty: { submit: text("word", 40), finalize: empty, next: empty },
  brainBurst: { answer: index, reveal: empty, next: empty },
  bunker: { join: empty, vote: target },
  cardsChaos: { submit: text("card", 120), judge: z.object({ winner: z.string().min(1).max(128) }).strict(), next: empty },
  charades: { correct: empty, skip: empty, finalize: empty, next: empty },
  codenames: {
    setSpymaster: z.object({ tm: z.enum(["a", "b"]) }).strict(),
    giveClue: z.object({ wd: z.string().trim().min(1).max(40), nm: z.number().int().min(1).max(9) }).strict(),
    pickWord: z.object({ idx: z.number().int().min(0).max(24) }).strict(),
  },
  crocodil: { correct: empty, pass: empty, finalize: empty, next: empty },
  fibbage: { answer: text("text", 100), openVote: empty, vote: target, reveal: empty, next: empty },
  gartic: {
    prompt: text("text", 180), guess: text("text", 180), drawingDone: empty,
    stroke: z.object({ points: z.array(point).min(1).max(32) }).strict(),
  },
  guessSong: { guess: text("title", 120) },
  headsup: { correct: empty, skip: empty, finalize: empty, next: empty },
  impostor: { clue: text("clue", 80), guess: text("word", 80), vote: target },
  kissMarry: {
    vote: z.object({ assignment: z.array(z.number().int().min(0).max(2)).length(3).refine((value) => new Set(value).size === 3, "Each action must be used once.") }).strict(),
    reveal: empty,
    next: empty,
  },
  pictionary: { guess: text("text", 120), stroke: z.object({ points: z.array(point).min(1).max(32) }).strict() },
  quiplash: { answer: text("text", 160), openVote: empty, vote: target, reveal: empty, next: empty },
  quiz: { answer: index, reveal: empty, next: empty },
  spyfall: { spyGuess: text("location", 120), vote: target },
  trivia: { answer: index, reveal: empty, next: empty },
  twoTruths: { vote: z.object({ index: z.number().int().min(0).max(2) }).strict(), reveal: empty, next: empty },
  uno: { draw: empty, play: z.object({ cardId: z.string().min(1).max(80), color: z.enum(["red", "yellow", "green", "blue"]) }).strict() },
  wavelength: { clue: text("text", 100), guess: z.object({ value: z.number().int().min(1).max(10) }).strict(), reveal: empty, next: empty },
  werewolf: {
    join: z.object({ playerId: z.string().min(1).max(128) }).strict(),
    nightAction: z.object({ tp: z.enum(["mafia", "doctor", "seer", "villager"]), tg: z.string().min(1).max(128) }).strict(),
    vote: target,
  },
  wheel: { addOption: text("text", 80) },
  wouldRather: { vote: z.object({ choice: z.enum(["a", "b"]) }).strict(), reveal: empty, next: empty },
};

export function parseGameCommand(gameId: string, actionType: string, payload: unknown) {
  const schema = COMMANDS[gameId]?.[actionType];
  if (!schema) return { success: false as const, error: `Command ${actionType} is not allowed for ${gameId}.` };
  const parsed = schema.safeParse(payload ?? {});
  return parsed.success ? { success: true as const, payload: parsed.data } : { success: false as const, error: "Invalid game command payload.", details: parsed.error.flatten() };
}

export const COMMAND_GAMES = Object.freeze(Object.keys(COMMANDS));
