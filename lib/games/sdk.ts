import type { z } from "zod";
import type { ServerGameContext, ServerGameResult } from "./definition";
import { deriveVerifiedScore } from "./scoring";
import impostor from "./definitions/impostor";
import trivia from "./definitions/trivia";
import bombParty from "./definitions/bomb-party";
import punchline from "./definitions/punchline";
import fakeFact from "./definitions/fake-fact";
import wouldRather from "./definitions/would-rather";
import twoTruths from "./definitions/two-truths";
import brainBurst from "./definitions/brain-burst";
import spectrum from "./definitions/spectrum";
import blankSlate from "./definitions/blank-slate";
import cardsChaos from "./definitions/cards-chaos";
import charades from "./definitions/charades";
import mimeRiot from "./definitions/mime-riot";
import foreheadGuess from "./definitions/forehead-guess";
import lostLocation from "./definitions/lost-location";
import pickThree from "./definitions/pick-three";

type Entry = {
  id: string;
  createInitialState: (participants: string[], config: Record<string, unknown>, now?: number) => Record<string, unknown> | null;
  commandSchemas: Record<string, z.ZodType>;
  reducer: (state: Record<string, unknown>, actionType: string, payload: unknown, context: ServerGameContext) => ServerGameResult;
  deriveScore: (state: Record<string, unknown>) => number;
};

const DEFINITIONS = new Map<string, Entry>();

function register<T extends Record<string, unknown>>(def: {
  id: string;
  createInitialState: (participants: string[], config: Record<string, unknown>, now?: number) => T | null;
  commandSchemas: Record<string, z.ZodType>;
  reducer: (state: T, actionType: string, payload: unknown, context: ServerGameContext) => ServerGameResult;
  deriveScore: (state: T) => number;
}) {
  DEFINITIONS.set(def.id, def as unknown as Entry);
}

register(impostor);
register(trivia);
register(bombParty);
register(punchline);
register(fakeFact);
register(wouldRather);
register(twoTruths);
register(brainBurst);
register(spectrum);
register(blankSlate);
register(cardsChaos);
register(charades);
register(mimeRiot);
register(foreheadGuess);
register(lostLocation);
register(pickThree);

export function getDefinition(gameId: string): Entry | undefined {
  return DEFINITIONS.get(gameId);
}

export function hasDefinition(gameId: string): boolean {
  return DEFINITIONS.has(gameId);
}

export function createInitialState(gameId: string, participants: string[], config: Record<string, unknown>, now = Date.now()): Record<string, unknown> | null {
  return DEFINITIONS.get(gameId)?.createInitialState(participants, config, now) ?? null;
}

export function applyCommand(gameId: string, state: Record<string, unknown>, actionType: string, payload: unknown, ctx: ServerGameContext): ServerGameResult | null {
  const def = DEFINITIONS.get(gameId);
  if (!def) return null;
  return def.reducer(state, actionType, payload, ctx);
}

export function deriveScore(gameId: string, state: Record<string, unknown>): number {
  const def = DEFINITIONS.get(gameId);
  if (def) return def.deriveScore(state);
  return deriveVerifiedScore(state);
}

export function getCommandSchemas(gameId: string): Record<string, z.ZodType> | null {
  return DEFINITIONS.get(gameId)?.commandSchemas ?? null;
}

export function parseGameCommand(gameId: string, actionType: string, payload: unknown) {
  const schemas = getCommandSchemas(gameId);
  if (!schemas) return null;
  const schema = schemas[actionType];
  if (!schema) return null;
  const parsed = schema.safeParse(payload ?? {});
  return parsed.success
    ? { success: true as const, payload: parsed.data }
    : { success: false as const, error: "Invalid game command payload.", details: parsed.error.flatten() };
}

export function getAvailableCommandTypes(gameId: string): string[] {
  const schemas = getCommandSchemas(gameId);
  return schemas ? Object.keys(schemas) : [];
}

export function isSdkManaged(gameId: string): boolean {
  return DEFINITIONS.has(gameId);
}
