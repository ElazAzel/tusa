import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getGlobalLeaderboard } from "@/lib/parties";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leaders = await getGlobalLeaderboard();
  return NextResponse.json({ leaders });
}
