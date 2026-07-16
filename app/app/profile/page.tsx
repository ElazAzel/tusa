import { getDashboard, syncProfile } from "@/lib/parties";
import ProfileEditor from "./ProfileEditor";
import { fallbackProfile, requireAppUser, rethrowRedirect } from "../auth-runtime";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let profile: Awaited<ReturnType<typeof syncProfile>> | null = null;
  let parties: Awaited<ReturnType<typeof getDashboard>> = [];
  try {
    const user = await requireAppUser("/app/profile");
    profile = await syncProfile({ id: user.userId, displayName: user.displayName, imageUrl: user.imageUrl });
    parties = await getDashboard(user.userId);
  } catch (err) {
    rethrowRedirect(err);
    console.error("[ProfilePage] render error:", err);
    const fallback = await requireAppUser("/app/profile");
    profile = fallbackProfile(fallback);
    parties = [];
  }
  return <ProfileEditor profile={profile} parties={parties} />;
}
