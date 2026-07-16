import { getGlobalLeaderboard, syncProfile } from "@/lib/parties";
import LeaderboardPage from "./LeaderboardPage";
import { fallbackProfile, requireAppUser, rethrowRedirect } from "../auth-runtime";

export const dynamic = "force-dynamic";

export default async function LeaderboardRoute() {
  let profile: Awaited<ReturnType<typeof syncProfile>> | null = null;
  let leaders: Awaited<ReturnType<typeof getGlobalLeaderboard>> = [];
  try {
    const user = await requireAppUser("/app/leaderboard");
    profile = await syncProfile({ id: user.userId, displayName: user.displayName, imageUrl: user.imageUrl });
    leaders = await getGlobalLeaderboard();
  } catch (err) {
    rethrowRedirect(err);
    console.error("[LeaderboardRoute] render error:", err);
    const fallback = await requireAppUser("/app/leaderboard");
    profile = fallbackProfile(fallback);
  }
  return <LeaderboardPage profile={profile} leaders={leaders} />;
}
