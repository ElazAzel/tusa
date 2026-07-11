import { auth } from "@clerk/nextjs/server";
import { getUserGameStats } from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const stats = await getUserGameStats(userId);
  return Response.json({ stats });
}
