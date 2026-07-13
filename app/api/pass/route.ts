import { NextRequest, NextResponse } from "next/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getActivePartyPassSeason, getUserPassProgress } from "@/lib/parties";
import { resolveActor } from "@/lib/guest-session";

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveActor();
    if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const limit = await distributedRateLimit(`pass:read:${actor.id}:${getClientIp(request.headers)}`, 30, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    const [season, progress] = await Promise.all([getActivePartyPassSeason(), getUserPassProgress(actor.id)]);
    return NextResponse.json({ season, progress });
  } catch { return NextResponse.json({ error: "Pass error" }, { status: 500 }); }
}
