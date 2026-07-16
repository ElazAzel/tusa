import { getFriends, getFriendRequests, syncProfile } from "@/lib/parties";
import FriendsPage from "./FriendsPage";
import { fallbackProfile, requireAppUser, rethrowRedirect } from "../auth-runtime";

export const dynamic = "force-dynamic";

export default async function FriendsRoute() {
  let profile: Awaited<ReturnType<typeof syncProfile>> | null = null;
  let friends: Awaited<ReturnType<typeof getFriends>> = [];
  let requests: Awaited<ReturnType<typeof getFriendRequests>> = [];
  try {
    const user = await requireAppUser("/app/friends");
    profile = await syncProfile({ id: user.userId, displayName: user.displayName, imageUrl: user.imageUrl });
    friends = await getFriends(user.userId);
    requests = await getFriendRequests(user.userId);
  } catch (err) {
    rethrowRedirect(err);
    console.error("[FriendsRoute] render error:", err);
    const fallback = await requireAppUser("/app/friends");
    profile = fallbackProfile(fallback);
  }
  return <FriendsPage profile={profile} friends={friends} requests={requests} />;
}
