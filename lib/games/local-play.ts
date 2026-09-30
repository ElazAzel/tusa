import { applyServerGameCommand } from "./engine";

type Context = { creatorId: string; participants: string[]; now: number };

export function applyLocalSeatCommand(game: string, state: Record<string, unknown>, actionType: string, payload: unknown, seat: string, context: Context) {
  const asSeat = applyServerGameCommand(game, state, actionType, payload, { ...context, actorId: seat });
  if (asSeat?.error && /^Only the stage/.test(asSeat.error)) {
    return { result: applyServerGameCommand(game, state, actionType, payload, { ...context, actorId: context.creatorId }), actedAs: "host" as const };
  }
  return { result: asSeat, actedAs: "seat" as const };
}
