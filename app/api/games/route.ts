import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { addGameAction, addGameScore, createGameSession, getActiveGameSessions, getGameScores, getGameSessionById, getPartyMembers, getPendingGameActions, joinGameSession, leaveGameSession, updateGameSession, trackAnalytics, grantEngagementReward } from "@/lib/parties";
import { publish } from "@/lib/live";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:games`, 30, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));

  if (body.action === "create") {
    if (!body.partyId || !body.game) return NextResponse.json({ error: "Укажите partyId и game." }, { status: 400 });
    const session = await createGameSession(body.partyId, body.game, body.config, userId);
    await joinGameSession(session.id, userId);
    const updated = await getGameSessionById(session.id);
    publish(`game:${session.id}`, { type: "session:created", session: updated });
    publish(`party:${body.partyId}`, { type: "session:created", session: updated });
    return NextResponse.json({ session: updated }, { status: 201 });
  }

  if (body.action === "join") {
    const current = await getGameSessionById(body.sessionId);
    if (!current) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (current.status !== "lobby" && !current.participants.includes(userId)) return NextResponse.json({ session: current, spectator: true });
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await joinGameSession(body.sessionId, userId);
    if (!session) return NextResponse.json({ error: "Сессия не найдена." }, { status: 404 });
    publish(`game:${body.sessionId}`, { type: "player:joined", sessionId: body.sessionId, userId, participants: session.participants });
    publish(`party:${session.partyId}`, { type: "session:updated", session });
    return NextResponse.json({ session });
  }

  if (body.action === "start") {
    const current = await getGameSessionById(body.sessionId);
    if (!current) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    if (current.createdBy !== userId) return NextResponse.json({ error: "Only the game creator can start." }, { status: 403 });
    if (current.participants.length < 2) return NextResponse.json({ error: "At least two players are required." }, { status: 400 });
    const session = await updateGameSession(body.sessionId, userId, { status: "active" });
    if (!session) return NextResponse.json({ error: "Session could not start." }, { status: 409 });
    publish(`party:${session.partyId}`, { type: "session:updated", session: { ...session, participants: current.participants, createdBy: current.createdBy } });
    return NextResponse.json({ session: { ...session, participants: current.participants, createdBy: current.createdBy } });
  }

  if (body.action === "leave") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await leaveGameSession(body.sessionId, userId);
    if (!session) return NextResponse.json({ error: "Сессия не найдена." }, { status: 404 });
    publish(`game:${body.sessionId}`, { type: "player:left", sessionId: body.sessionId, userId, participants: session.participants });
    publish(`party:${session.partyId}`, { type: "session:updated", session });
    return NextResponse.json({ session });
  }

  if (body.action === "update") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await updateGameSession(body.sessionId, userId, { status: body.status, state: body.state, expectedVersion: body.version });
    if (!session) return NextResponse.json({ error: "Конфликт версии — обновите страницу.", retry: true }, { status: 409 });
    return NextResponse.json({ session });
  }

  if (body.action === "complete") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await updateGameSession(body.sessionId, userId, { status: "completed" });
    if (!session) return NextResponse.json({ error: "Сессия не найдена." }, { status: 404 });
    publish(`game:${body.sessionId}`, { type: "session:completed", sessionId: body.sessionId });
    publish(`party:${session.partyId}`, { type: "session:completed", sessionId: body.sessionId });
    return NextResponse.json({ session });
  }

  if (body.action === "score") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await getGameSessionById(body.sessionId);
    const metadata = { ...(body.metadata ?? {}), clientMutationId: body.clientMutationId || `${userId}_${Date.now()}` };
    const score = await addGameScore(body.sessionId, userId, body.score ?? 0, metadata);
    const scores = await getGameScores(body.sessionId);
    publish(`game:${body.sessionId}`, { type: "score:added", sessionId: body.sessionId, score, scores });
    trackAnalytics(userId, "game_played", { sessionId: body.sessionId, game: body.metadata?.game, score: body.score });
    grantEngagementReward(userId, "game_play", session?.partyId).catch(() => undefined);
    if ((body.score ?? 0) > 0) grantEngagementReward(userId, "game_win", session?.partyId).catch(() => undefined);
    return NextResponse.json({ score, scores });
  }

  if (body.action === "playerAction") {
    if (!body.sessionId || !body.actionType) return NextResponse.json({ error: "Укажите sessionId и actionType." }, { status: 400 });
    const gameAction = await addGameAction(body.sessionId, userId, String(body.actionType), body.payload ?? {});
    return NextResponse.json({ ok: true, action: gameAction });
  }

  return NextResponse.json({ error: "Неверный action." }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:games`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const partyId = url.searchParams.get("partyId");

  if (sessionId) {
    const [scores, session] = await Promise.all([getGameScores(sessionId), getGameSessionById(sessionId)]);
    const actions = session?.createdBy === userId ? await getPendingGameActions(sessionId) : [];
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
    const isParticipant = session.participants.includes(userId);
    if (!isParticipant) {
      const members = await getPartyMembers(session.partyId);
      if (!members.some((member) => member.clerkUserId === userId)) return NextResponse.json({ error: "Not a party member." }, { status: 403 });
    }
    const safeSession = session.createdBy === userId ? session : { ...session, state: sanitizeControllerState(session.game, session.state, userId) };
    return NextResponse.json({ scores, session: safeSession, actions, spectator: !isParticipant });
  }

  if (partyId) {
    const sessions = await getActiveGameSessions(partyId);
    return NextResponse.json({ sessions });
  }

  return NextResponse.json({ error: "Укажите sessionId или partyId." }, { status: 400 });
}

function sanitizeControllerState(game: string, rawState: Record<string, unknown>, userId: string) {
  const state = structuredClone(rawState);
  const phase = String(state.phase ?? "");
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
