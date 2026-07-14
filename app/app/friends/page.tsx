import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFriends, getFriendRequests, syncProfile } from "@/lib/parties";
import FriendsPage from "./FriendsPage";

export const dynamic = "force-dynamic";

export default async function FriendsRoute() {
  let userId: string | null = null;
  let user: Awaited<ReturnType<typeof currentUser>> = null;
  try { userId = (await auth()).userId ?? null; user = await currentUser(); } catch { /* auth unavailable */ }
  if (!userId || !user) redirect("/sign-in?redirect_url=/app/friends");
  const profile = await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
  const friends = await getFriends(userId);
  const requests = await getFriendRequests(userId);
  return <FriendsPage profile={profile} friends={friends} requests={requests} />;
}
