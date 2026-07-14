import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getGlobalLeaderboard, syncProfile } from "@/lib/parties";
import LeaderboardPage from "./LeaderboardPage";

export const dynamic = "force-dynamic";

export default async function LeaderboardRoute() {
  let userId: string | null = null;
  let user: Awaited<ReturnType<typeof currentUser>> = null;
  let profile: Awaited<ReturnType<typeof syncProfile>> | null = null;
  let leaders: Awaited<ReturnType<typeof getGlobalLeaderboard>> = [];
  try {
    try { userId = (await auth()).userId ?? null; user = await currentUser(); } catch { /* auth unavailable */ }
    if (!userId || !user) redirect("/sign-in?redirect_url=/app/leaderboard");
    profile = await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
    leaders = await getGlobalLeaderboard();
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[LeaderboardRoute] render error:", err);
    redirect("/sign-in?redirect_url=/app/leaderboard");
  }
  return <LeaderboardPage profile={profile} leaders={leaders} />;
}
