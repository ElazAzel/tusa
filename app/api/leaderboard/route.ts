import { auth } from "@/lib/local-auth/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getGlobalLeaderboard } from "@/lib/parties";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`api:${ip}:leaderboard`, 60, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
    const leaders = await getGlobalLeaderboard();
    return NextResponse.json({ leaders });
  } catch { return NextResponse.json({ error: "Leaderboard error" }, { status: 500 }); }
}
