import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  addGameAction, addGameScore, createGameSession, getActiveGameSessions, getGameScores, getGameActionByMutationId,
  getGameSessionById, getPartyMembers, getPendingGameActions, joinGameSession,
  leaveGameSession, requirePartyMember, updateGameSession, trackAnalytics, grantEngagementReward,
  addPassXp, trackQuestProgress,
} from "@/lib/parties";
import { isGameId } from "@/lib/games/manifest";
import { publish } from "@/lib/live";
import { resolveActor } from "@/lib/guest-session";
import { deriveVerifiedScore } from "@/lib/games/scoring";
import { parseGameCommand } from "@/lib/games/commands";
import { applyServerGameCommand, initialServerGameState, isServerGameState } from "@/lib/games/engine";

const gameRequestSchema = z.object({
  action: z.enum(["create", "join", "start", "leave", "update", "complete", "score", "playerAction"]),
  partyId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  game: z.string().max(64).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["active", "paused"]).optional(),
  state: z.record(z.string(), z.unknown()).optional(),
  version: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  clientMutationId: z.string().min(8).max(64).optional(),
  actionType: z.string().min(1).max(80).regex(/^[a-zA-Z0-9:_-]+$/).optional(),
  payload: z.unknown().optional(),
}).strict();

function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (!actor) return apiError("Authentication required.", 401);
  const userId = actor.id;
  const ip = getClientIp(request.headers);
  const rl = await distributedRateLimit(`games:write:${userId}:${ip}`, 45, 60_000);
  if (!rl.allowed) return apiError("Too many game requests. Try again shortly.", 429);

  const parsed = gameRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid game request.", 400, parsed.error.flatten());
  const body = parsed.data;

  try {
    if (body.action === "create") {
      if (!body.partyId || !body.game || !isGameId(body.game)) return apiError("A valid partyId and game are required.", 400);
      await requirePartyMember(body.partyId, userId);
      const session = await createGameSession(body.partyId, body.game, body.config, userId);
      await joinGameSession(session.id, userId);
      const updated = await getGameSessionById(session.id);
      publish(`game:${session.id}`, { type: "session:created", session: updated });
      publish(`party:${body.partyId}`, { type: "session:created", session: updated });
      return NextResponse.json({ session: updated }, { status: 201 });
    }

    if (!body.sessionId) return apiError("sessionId is required.", 400);
    const current = await getGameSessionById(body.sessionId);
    if (!current) return apiError("Session not found.", 404);
    await requirePartyMember(current.partyId, userId);

    if (body.action === "join") {
      if (current.status !== "lobby" && !current.participants.includes(userId)) return NextResponse.json({ session: sanitizeControllerSession(current, userId), spectator: true });
      const session = await joinGameSession(body.sessionId, userId);
      if (!session) return apiError("Session not found.", 404);
      publish(`game:${body.sessionId}`, { type: "player:joined", sessionId: body.sessionId, userId, participants: session.participants });
      publish(`party:${session.partyId}`, { type: "session:updated", session });
      return NextResponse.json({ session });
    }

    if (body.action === "start") {
      if (current.createdBy !== userId) return apiError("Only the game creator can start.", 403);
      if (current.status !== "lobby") return apiError("Only a lobby can be started.", 409);
      if (current.participants.length < 2) return apiError("At least two players are required.", 400);
      const initialState = initialServerGameState(current.game, current.participants, current.config);
      const session = await updateGameSession(body.sessionId, userId, { status: "active", state: initialState ?? undefined, expectedVersion: current.version });
      if (!session) return apiError("Session version changed. Refresh and retry.", 409);
      const responseSession = { ...session, participants: current.participants, createdBy: current.createdBy };
      const publicSession = sanitizeControllerSession(responseSession, "");
      publish(`game:${body.sessionId}`, { type: "session:started", session: publicSession });
      publish(`party:${session.partyId}`, { type: "session:updated", session: publicSession });
      return NextResponse.json({ session: responseSession });
    }

    if (body.action === "leave") {
      const session = await leaveGameSession(body.sessionId, userId);
      if (!session) return apiError("Session not found.", 404);
      publish(`game:${body.sessionId}`, { type: "player:left", sessionId: body.sessionId, userId, participants: session.participants });
      publish(`party:${session.partyId}`, { type: "session:updated", session });
      return NextResponse.json({ session });
    }

    if (body.action === "update") {
      if (current.createdBy !== userId) return apiError("Only the game creator can update shared state.", 403);
      if (current.status === "completed" || current.status === "cancelled") return apiError("The session is closed.", 409);
      if (!body.state && !body.status) return apiError("No state or status update was provided.", 400);
      const session = await updateGameSession(body.sessionId, userId, { status: body.status, state: body.state, expectedVersion: body.version });
      if (!session) return apiError("Session version changed. Restore the latest snapshot.", 409, { retry: true });
      publish(`game:${body.sessionId}`, { type: "state:updated", sessionId: body.sessionId, version: session.version });
      return NextResponse.json({ session });
    }

    if (body.action === "complete") {
      if (current.createdBy !== userId) return apiError("Only the game creator can complete the session.", 403);
      const session = await updateGameSession(body.sessionId, userId, { status: "completed", expectedVersion: body.version ?? current.version });
      if (!session) return apiError("Session version changed. Refresh and retry.", 409);
      publish(`game:${body.sessionId}`, { type: "session:completed", sessionId: body.sessionId });
      publish(`party:${session.partyId}`, { type: "session:completed", sessionId: body.sessionId });
      return NextResponse.json({ session });
    }

    if (body.action === "score") {
      if (current.createdBy !== userId) return apiError("Only the game creator can submit the verified result.", 403);
      if (body.metadata?.game && body.metadata.game !== current.game) return apiError("Game metadata does not match the session.", 400);
      const verifiedScore = deriveVerifiedScore(current.state);
      const metadata = { game: current.game, scoring: "server-snapshot-v1", clientMutationId: body.clientMutationId || `${userId}_${body.sessionId}_${current.version}` };
      const score = await addGameScore(body.sessionId, userId, verifiedScore, metadata);
      const scores = await getGameScores(body.sessionId);
      publish(`game:${body.sessionId}`, { type: "score:added", sessionId: body.sessionId, score, scores });
      void trackAnalytics(userId, "game_played", { sessionId: body.sessionId, game: current.game, score: score.score });
      void grantEngagementReward(userId, "game_play", current.partyId).catch(() => undefined);
      if (score.score > 0) void grantEngagementReward(userId, "game_win", current.partyId).catch(() => undefined);
      void addPassXp(userId, Math.min(score.score, 50)).catch(() => undefined);
      void trackQuestProgress("playgames", current.partyId, userId).catch(() => undefined);
      return NextResponse.json({ score, scores });
    }

    if (body.action === "playerAction") {
      if (!body.actionType) return apiError("actionType is required.", 400);
      const actionType = body.actionType;
      if (current.status !== "lobby" && current.status !== "active" && current.status !== "paused") return apiError("The session is not accepting actions.", 409);
      const command = parseGameCommand(current.game, actionType, body.payload);
      if (!command.success) return apiError(command.error, 400, "details" in command ? command.details : undefined);
      const commandId = body.clientMutationId ?? randomUUID();
      const existingCommand = await getGameActionByMutationId(body.sessionId, userId, commandId);
      if (existingCommand) return NextResponse.json({ ok: true, commandId, action: existingCommand, duplicate: true });

      if (isServerGameState(current.state)) {
        let snapshot = current;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const creatorId = String(snapshot.createdBy ?? "");
          const reduced = applyServerGameCommand(snapshot.game, snapshot.state, actionType, command.payload, { actorId: userId, creatorId, participants: snapshot.participants, now: Date.now() });
          if (!reduced) break;
          if (reduced.error) return apiError(reduced.error, 409);
          if (!reduced.changed) return NextResponse.json({ ok: true, commandId, duplicate: true, session: sanitizeControllerSession(snapshot, userId) });
          const updated = await updateGameSession(body.sessionId, creatorId, { state: reduced.state, expectedVersion: snapshot.version });
          if (updated) {
            const gameAction = await addGameAction(body.sessionId, userId, actionType, command.payload, commandId);
            const responseSession = { ...updated, participants: snapshot.participants, createdBy: snapshot.createdBy };
            publish(`game:${body.sessionId}`, { type: "state:updated", sessionId: body.sessionId, state: sanitizeControllerState(snapshot.game, reduced.state, ""), version: updated.version });
            return NextResponse.json({ ok: true, commandId, action: gameAction, session: sanitizeControllerSession(responseSession, userId) });
          }
          const latest = await getGameSessionById(body.sessionId);
          if (!latest) return apiError("Session not found.", 404);
          snapshot = latest;
        }
        return apiError("Concurrent game update. Retry the command.", 409, { retry: true });
      }
      const gameAction = await addGameAction(body.sessionId, userId, actionType, command.payload, commandId);
      publish(`game:${body.sessionId}`, {
        type: "player:action",
        id: gameAction.id,
        sessionId: body.sessionId,
        userId,
        actionType: gameAction.actionType,
        payload: gameAction.payload,
        commandId,
      });
      return NextResponse.json({ ok: true, commandId, action: gameAction });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Game request failed.";
    if (/member|creator|player/i.test(message)) return apiError(message, 403);
    return apiError("Game request failed.", 500);
  }

  return apiError("Unsupported action.", 400);
}

export async function GET(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return apiError("Authentication required.", 401);
  const userId = actor.id;
  const ip = getClientIp(request.headers);
  const rl = await distributedRateLimit(`games:read:${userId}:${ip}`, 90, 60_000);
  if (!rl.allowed) return apiError("Too many game requests. Try again shortly.", 429);
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const partyId = request.nextUrl.searchParams.get("partyId");

  try {
    if (sessionId) {
      if (!z.string().uuid().safeParse(sessionId).success) return apiError("Invalid sessionId.", 400);
      const session = await getGameSessionById(sessionId);
      if (!session) return apiError("Session not found.", 404);
      await requirePartyMember(session.partyId, userId);
      const isParticipant = session.participants.includes(userId);
      const [scores, actions] = await Promise.all([
        getGameScores(sessionId),
        session.createdBy === userId ? getPendingGameActions(sessionId) : Promise.resolve([]),
      ]);
      const safeSession = session.createdBy === userId ? session : sanitizeControllerSession(session, userId);
      return NextResponse.json({ scores, session: safeSession, actions, spectator: !isParticipant });
    }

    if (partyId) {
      if (!z.string().uuid().safeParse(partyId).success) return apiError("Invalid partyId.", 400);
      const sessions = await getActiveGameSessions(partyId, userId);
      return NextResponse.json({ sessions: sessions.map((session) => session.createdBy === userId ? session : sanitizeControllerSession(session, userId)) });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Game request failed.";
    if (/member/i.test(message)) return apiError("Not a party member.", 403);
    return apiError("Game request failed.", 500);
  }

  return apiError("sessionId or partyId is required.", 400);
}

type SessionView = NonNullable<Awaited<ReturnType<typeof getGameSessionById>>>;

function sanitizeControllerSession(session: SessionView, userId: string) {
  return { ...session, state: sanitizeControllerState(session.game, session.state, userId) };
}

function sanitizeControllerState(game: string, rawState: Record<string, unknown>, userId: string) {
  const state = structuredClone(rawState);
  const phase = String(state.phase ?? "");
  if ((game === "trivia" || game === "quiz" || game === "brainBurst") && phase === "question") state.correct = -1;
  if (game === "twoTruths" && phase === "vote") state.lie = -1;
  if (game === "blankSlate" && phase === "write") {
    const submissions = (state.submissions ?? {}) as Record<string, string>;
    state.submissions = Object.fromEntries(Object.keys(submissions).map((id) => [id, id === userId ? submissions[id] : ""]));
  }
  if (game === "bombParty" && phase === "play") {
    const submissions = (state.submissions ?? {}) as Record<string, string>;
    state.submissions = Object.fromEntries(Object.keys(submissions).map((id) => [id, id === userId ? submissions[id] : ""]));
    delete state.usedWords;
  }
  if (game === "wavelength" && phase !== "reveal" && phase !== "finished") state.target = -1;
  if (game === "quiplash" && phase === "answer") {
    const submissions = (state.submissions ?? {}) as Record<string, string>;
    state.submissions = Object.fromEntries(Object.keys(submissions).map((id) => [id, id === userId ? submissions[id] : ""]));
  }
  if ((game === "werewolf" || game === "mafia") && phase !== "reveal") {
    const roles = (state.roles ?? {}) as Record<string, unknown>;
    state.roles = roles[userId] ? { [userId]: roles[userId] } : {};
  }
  if (game === "impostor" && phase !== "reveal") {
    const isImpostor = state.impostorId === userId;
    state.word = isImpostor ? "" : state.word;
    state.impostorId = isImpostor ? userId : null;
  }
  if (game === "spyfall" && phase !== "reveal") {
    const isSpy = state.spyId === userId;
    state.location = isSpy ? "" : state.location;
    state.spyId = isSpy ? userId : null;
  }
  if (game === "codenames" && phase !== "reveal") {
    const isSpymaster = state.spymasterA === userId || state.spymasterB === userId;
    if (!isSpymaster) {
      const colors = Array.isArray(state.colors) ? state.colors : [];
      const revealed = Array.isArray(state.revealed) ? state.revealed : [];
      state.colors = colors.map((color, index) => revealed[index] ? color : "neutral");
    }
  }
  if (game === "uno") {
    const hands = (state.hands ?? {}) as Record<string, unknown>;
    state.hands = hands[userId] ? { [userId]: hands[userId] } : {};
    state.drawPile = [];
  }
  if (game === "pictionary" && phase === "drawing" && state.drawerId !== userId) state.word = "";
  if (game === "gartic") {
    const assignments = (state.assignments ?? {}) as Record<string, string>;
    const source = assignments[userId];
    const prompts = (state.prompts ?? {}) as Record<string, unknown>;
    const drawings = (state.drawings ?? {}) as Record<string, unknown>;
    state.prompts = source && prompts[source] ? { [source]: prompts[source] } : {};
    state.drawings = { ...(drawings[userId] ? { [userId]: drawings[userId] } : {}), ...(source && drawings[source] ? { [source]: drawings[source] } : {}) };
    state.guesses = {};
  }
  if (game === "cardsChaos") {
    const hands = (state.hands ?? {}) as Record<string, unknown>;
    state.hands = hands[userId] ? { [userId]: hands[userId] } : {};
    if (phase === "play") state.submissions = {};
  }
  return state;
}
