import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { addGameScore, createGameSession, getActiveGameSessions, getGameScores, getGameSessionById, joinGameSession, leaveGameSession, updateGameSession, trackAnalytics, grantEngagementReward } from "@/lib/parties";
import { publish } from "@/lib/live";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  if (body.action === "create") {
    if (!body.partyId || !body.game) return NextResponse.json({ error: "Укажите partyId и game." }, { status: 400 });
    const session = await createGameSession(body.partyId, body.game, body.config);
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
    const session = await updateGameSession(body.sessionId, { status: body.status, state: body.state });
    if (!session) return NextResponse.json({ error: "Сессия не найдена." }, { status: 404 });
    publish(`game:${body.sessionId}`, { type: "state:updated", sessionId: body.sessionId, state: body.state, status: body.status });
    return NextResponse.json({ session });
  }

  if (body.action === "complete") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await updateGameSession(body.sessionId, { status: "completed" });
    if (!session) return NextResponse.json({ error: "Сессия не найдена." }, { status: 404 });
    publish(`game:${body.sessionId}`, { type: "session:completed", sessionId: body.sessionId });
    return NextResponse.json({ session });
  }

  if (body.action === "score") {
    if (!body.sessionId) return NextResponse.json({ error: "Укажите sessionId." }, { status: 400 });
    const session = await getGameSessionById(body.sessionId);
    const score = await addGameScore(body.sessionId, userId, body.score ?? 0, body.metadata);
    const scores = await getGameScores(body.sessionId);
    publish(`game:${body.sessionId}`, { type: "score:added", sessionId: body.sessionId, score, scores });
    trackAnalytics(userId, "game_played", { sessionId: body.sessionId, game: body.metadata?.game, score: body.score });
    grantEngagementReward(userId, "game_play", session?.partyId).catch(() => undefined);
    if ((body.score ?? 0) > 0) grantEngagementReward(userId, "game_win", session?.partyId).catch(() => undefined);
    return NextResponse.json({ score, scores });
  }

  return NextResponse.json({ error: "Неверный action." }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
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
