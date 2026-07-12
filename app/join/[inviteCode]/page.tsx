import { auth, currentUser } from "@clerk/nextjs/server";
import { getPartyByInvite, syncProfile } from "@/lib/parties";
import JoinPartyCard from "./JoinPartyCard";

export const dynamic = "force-dynamic";

export default async function JoinPartyPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params;
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  if (userId && user) await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
  const party = await getPartyByInvite(inviteCode);
  return <JoinPartyCard party={party} inviteCode={inviteCode} isSignedIn={Boolean(userId)} />;
}
