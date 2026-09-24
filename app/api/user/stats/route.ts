import { auth } from "@/lib/local-auth/server";
import { distributedRateLimit } from "@/lib/rate-limit";
import { getUserGameStats } from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = await distributedRateLimit(`api:${ip}:user:stats`, 30, 60000);
    if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
    const stats = await getUserGameStats(userId);
    return Response.json({ stats });
  } catch { return Response.json({ error: "Stats error" }, { status: 500 }); }
}
