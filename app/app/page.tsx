import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboard, syncProfile } from "@/lib/parties";
import UserDashboard from "./UserDashboard";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  let userId: string | null = null;
  let user: Awaited<ReturnType<typeof currentUser>> = null;
  let profile: Awaited<ReturnType<typeof syncProfile>> | null = null;
  let parties: Awaited<ReturnType<typeof getDashboard>> = [];
  try {
    try { userId = (await auth()).userId ?? null; user = await currentUser(); } catch { /* auth unavailable */ }
    if (!userId || !user) redirect("/sign-in?redirect_url=/app");
    profile = await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
    parties = await getDashboard(userId);
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[AppHomePage] render error:", err);
    redirect("/sign-in?redirect_url=/app");
  }
  return <UserDashboard profile={profile} parties={parties} />;
}
