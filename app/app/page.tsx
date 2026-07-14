import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboard, syncProfile } from "@/lib/parties";
import UserDashboard from "./UserDashboard";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  let userId: string | null = null;
  let user: Awaited<ReturnType<typeof currentUser>> = null;
  try { userId = (await auth()).userId ?? null; user = await currentUser(); } catch { /* auth unavailable */ }
  if (!userId || !user) redirect("/sign-in?redirect_url=/app");
  const profile = await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
  const parties = await getDashboard(userId);
  return <UserDashboard profile={profile} parties={parties} />;
}
