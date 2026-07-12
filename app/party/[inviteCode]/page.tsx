import { redirect } from "next/navigation";
import { joinParty, syncProfile } from "@/lib/parties";
import { resolveActor } from "@/lib/guest-session";
import PartyRoom from "./PartyRoom";

export const dynamic = "force-dynamic";

export default async function PartyRoomPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params;
  const actor = await resolveActor();
  if (!actor) redirect(`/join/${inviteCode}`);
  if (actor.kind === "guest" && actor.guest?.inviteCode !== inviteCode) redirect(`/join/${inviteCode}`);
  await syncProfile({ id: actor.id, displayName: actor.displayName, imageUrl: actor.imageUrl });
  const party = await joinParty(actor.id, inviteCode);
  if (!party) redirect(actor.kind === "guest" ? `/join/${inviteCode}` : "/app");
  return <PartyRoom party={party} actorId={actor.id} />;
}
