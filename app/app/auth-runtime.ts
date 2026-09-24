import "server-only";

import { auth, currentUser } from "@/lib/local-auth/server";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/lib/parties";

type AccountUser = Awaited<ReturnType<typeof currentUser>>;

export async function requireAppUser(redirectUrl: string) {
  let userId: string | null = null;
  try {
    userId = (await auth()).userId ?? null;
  } catch (error) {
    console.error("[app-auth] auth unavailable", error instanceof Error ? error.message : String(error));
  }

  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`);

  let user: AccountUser = null;
  try {
    user = await currentUser();
  } catch (error) {
    console.error("[app-auth] currentUser unavailable", error instanceof Error ? error.message : String(error));
  }

  return {
    userId,
    displayName: user?.fullName ?? user?.firstName ?? `TUSA ${userId.slice(-6)}`,
    imageUrl: user?.imageUrl,
    emailVerified: user?.emailVerified ?? false,
  };
}

export function rethrowRedirect(error: unknown) {
  if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;
}

export function fallbackProfile(user: Awaited<ReturnType<typeof requireAppUser>>): UserProfile {
  return {
    id: user.userId,
    displayName: user.displayName,
    handle: `tusa${user.userId.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase()}`,
    city: "",
    bio: "",
    imageUrl: user.imageUrl ?? "",
    compashka: "",
    cosmetics: { cover: "lime", avatarFrame: "none", chatEffect: "none", chatBackground: "paper", nameColor: "#000000", badge: "newcomer", xpMultiplier: 1, betaAccess: false, unlocked: [] },
    xp: 0,
    hasPartyCreation: false,
    updatedAt: new Date().toISOString(),
  };
}
