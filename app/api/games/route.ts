import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { addGameScore, createGameSession, getActiveGameSessions, getGameScores, getGameSessionById, joinGameSession, leaveGameSession, updateGameSession, trackAnalytics, grantEngagementReward } from "@/lib/parties";
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
    return NextResponse.json({ session: updated }, { status: 201 });
  }

  if (body.action === "join") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await joinGameSession(body.sessionId, userId);
    if (!session) return NextResponse.json({ error: "Сессия не найдена." }, { status: 404 });
    publish(`game:${body.sessionId}`, { type: "player:joined", sessionId: body.sessionId, userId, participants: session.participants });
    return NextResponse.json({ session });
  }

  if (body.action === "leave") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await leaveGameSession(body.sessionId, userId);
    if (!session) return NextResponse.json({ error: "Сессия не найдена." }, { status: 404 });
    publish(`game:${body.sessionId}`, { type: "player:left", sessionId: body.sessionId, userId, participants: session.participants });
    return NextResponse.json({ session });
  }

  if (body.action === "update") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await updateGameSession(body.sessionId, userId, { status: body.status, state: body.state, expectedVersion: body.version });
    if (!session) return NextResponse.json({ error: "Конфликт версии — обновите страницу.", retry: true }, { status: 409 });
    publish(`game:${body.sessionId}`, { type: "state:updated", sessionId: body.sessionId, state: body.state, status: body.status, version: session.version });
    return NextResponse.json({ session });
  }

  if (body.action === "complete") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await updateGameSession(body.sessionId, userId, { status: "completed" });
    if (!session) return NextResponse.json({ error: "Сессия не найдена." }, { status: 404 });
    publish(`game:${body.sessionId}`, { type: "session:completed", sessionId: body.sessionId });
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
    publish(`game:${body.sessionId}`, { type: "player:action", sessionId: body.sessionId, userId, actionType: body.actionType, payload: body.payload ?? {} });
    return NextResponse.json({ ok: true });
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
    const scores = await getGameScores(sessionId);
    return NextResponse.json({ scores });
  }

  if (partyId) {
    const sessions = await getActiveGameSessions(partyId);
    return NextResponse.json({ sessions });
  }

  return NextResponse.json({ error: "Укажите sessionId или partyId." }, { status: 400 });
}
