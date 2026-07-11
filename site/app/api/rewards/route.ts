import { auth } from "@clerk/nextjs/server";
import { grantEngagementReward, getEngagementStats } from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const stats = await getEngagementStats(userId);
  return Response.json({ stats });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.activity) return Response.json({ error: "activity required" }, { status: 400 });
  const result = await grantEngagementReward(userId, body.activity, body.partyId);
  return Response.json(result);
}
