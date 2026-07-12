import { NextRequest, NextResponse } from "next/server";
import { createRealtimeTokenRequest } from "@/lib/live";
import { getGameSessionById, requirePartyMember } from "@/lib/parties";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { resolveActor } from "@/lib/guest-session";

const channelPattern = /^(party|chat|game):([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export async function GET(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const userId = actor.id;
  const rl = await distributedRateLimit(`realtime:token:${userId}:${getClientIp(request.headers)}`, 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many token requests." }, { status: 429 });

  const channel = request.nextUrl.searchParams.get("channel") ?? "";
  const match = channel.match(channelPattern);
  if (!match) return NextResponse.json({ error: "Invalid channel." }, { status: 400 });
  const [, scope, id] = match;

  try {
    if (scope === "game") {
      const session = await getGameSessionById(id);
      if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
      await requirePartyMember(session.partyId, userId);
    } else {
      await requirePartyMember(id, userId);
    }
    const tokenRequest = await createRealtimeTokenRequest(userId, channel);
    return NextResponse.json(tokenRequest, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Realtime token failed.";
    const status = message.includes("configured") ? 503 : 403;
    return NextResponse.json({ error: status === 503 ? message : "Forbidden." }, { status });
  }
}
