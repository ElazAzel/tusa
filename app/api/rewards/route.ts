import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { grantEngagementReward, getEngagementStats } from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:rewards`, 60, 60000);
  if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
  const stats = await getEngagementStats(userId);
  return Response.json({ stats });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:rewards`, 10, 60000);
  if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json();
  if (!body.activity) return Response.json({ error: "activity required" }, { status: 400 });
  const result = await grantEngagementReward(userId, body.activity, body.partyId);
  return Response.json(result);
}
