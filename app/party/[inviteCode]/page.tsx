import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { joinParty, syncProfile } from "@/lib/parties";
import PartyRoom from "./PartyRoom";

export const dynamic = "force-dynamic";

export default async function PartyRoomPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params;
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) redirect(`/sign-in?redirect_url=/party/${inviteCode}`);
  await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
  const party = await joinParty(userId, inviteCode);
  if (!party) redirect("/app");
  return <PartyRoom party={party} />;
}
