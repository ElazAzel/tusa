import type { z } from "zod";
import type { GameId } from "./manifest";

export type ServerGameContext = {
  actorId: string;
  creatorId: string;
  participants: string[];
  now: number;
};

export type ServerGameResult = {
  state: Record<string, unknown>;
  changed: boolean;
  error?: string;
};

export type PhaseTransition = {
  phase: string;
  deadline?: number;
  autoAdvance?: {
    command: string;
    delayMs: number;
  };
};

export type GameDefinition<TState extends Record<string, unknown> = Record<string, unknown>> = {
  id: GameId;
  version: number;

  /** Create initial state for a new game session */
  createInitialState: (participants: string[], config: Record<string, unknown>, now?: number) => TState | null;

  /** Zod schemas for all valid commands */
  commandSchemas: Record<string, z.ZodType>;

  /** Apply a command to the state and return the new state */
  reducer: (state: TState, actionType: string, payload: unknown, context: ServerGameContext) => ServerGameResult;

  /** Sanitize state for a specific viewer (controller, stage, spectator) */
  sanitizeForViewer?: (state: TState, viewerId: string) => TState;

  /** Get available commands for the current phase/role */
  getAvailableCommands?: (state: TState, viewerId: string) => string[];

  /** Fallback command when deadline expires (auto-advance) */
  getDeadlineFallback?: (state: TState) => { command: string; payload: unknown } | null;

  /** Extract verified score from state */
  deriveScore: (state: TState) => number;
};

export function defineGame<TState extends Record<string, unknown> = Record<string, unknown>>(
  def: GameDefinition<TState>,
): GameDefinition<TState> {
  return def as GameDefinition<TState>;
}

export function engineVersion(state: Record<string, unknown>): string | null {
  if (state.engine === "server-v1") return "v1";
  if (state.engine === "sdk-v1") return "sdk-v1";
  return null;
}
