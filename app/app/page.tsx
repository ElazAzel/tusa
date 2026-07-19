import { getDashboard, syncProfile } from "@/lib/parties";
import UserDashboard from "./UserDashboard";
import { fallbackProfile, requireAppUser, rethrowRedirect } from "./auth-runtime";

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  let profile: Awaited<ReturnType<typeof syncProfile>> | null = null;
  let parties: Awaited<ReturnType<typeof getDashboard>> = [];
  let emailVerified = false;
  try {
    const user = await requireAppUser("/app");
    profile = await syncProfile({ id: user.userId, displayName: user.displayName, imageUrl: user.imageUrl });
    parties = await getDashboard(user.userId);
    emailVerified = user.emailVerified;
  } catch (err) {
    rethrowRedirect(err);
    console.error("[AppHomePage] render error:", err);
    const fallback = await requireAppUser("/app");
    profile = fallbackProfile(fallback);
    parties = [];
    emailVerified = fallback.emailVerified;
  }
  return <UserDashboard profile={profile} parties={parties} emailVerified={emailVerified} />;
}
