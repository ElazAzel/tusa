import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFriends, getFriendRequests, syncProfile } from "@/lib/parties";
import FriendsPage from "./FriendsPage";

export const dynamic = "force-dynamic";

export default async function FriendsRoute() {
  let userId: string | null = null;
  let user: Awaited<ReturnType<typeof currentUser>> = null;
  let profile: Awaited<ReturnType<typeof syncProfile>> | null = null;
  let friends: Awaited<ReturnType<typeof getFriends>> = [];
  let requests: Awaited<ReturnType<typeof getFriendRequests>> = [];
  try {
    try { userId = (await auth()).userId ?? null; user = await currentUser(); } catch { /* auth unavailable */ }
    if (!userId || !user) redirect("/sign-in?redirect_url=/app/friends");
    profile = await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
    friends = await getFriends(userId);
    requests = await getFriendRequests(userId);
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[FriendsRoute] render error:", err);
    redirect("/sign-in?redirect_url=/app/friends");
  }
  return <FriendsPage profile={profile} friends={friends} requests={requests} />;
}
