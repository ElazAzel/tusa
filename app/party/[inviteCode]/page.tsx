import { redirect } from "next/navigation";
import { getProfile, joinParty, syncProfile } from "@/lib/parties";
import { resolveActor } from "@/lib/guest-session";
import PartyRoom from "./PartyRoom";

export const dynamic = "force-dynamic";

export default async function PartyRoomPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = await params;
  let actor;
  try { actor = await resolveActor(); } catch { redirect(`/join/${inviteCode}`); }
  if (!actor) redirect(`/join/${inviteCode}`);
  if (actor.kind === "guest" && actor.guest?.inviteCode !== inviteCode) redirect(`/join/${inviteCode}`);
  try { await syncProfile({ id: actor.id, displayName: actor.displayName, imageUrl: actor.imageUrl }); } catch { /* profile sync failed, continue */ }
  let party;
  try { party = await joinParty(actor.id, inviteCode); } catch { redirect(actor.kind === "guest" ? `/join/${inviteCode}` : "/app"); }
  if (!party) redirect(actor.kind === "guest" ? `/join/${inviteCode}` : "/app");
  const profile = await getProfile(actor.id).catch(() => null);
  return <PartyRoom party={party!} actorId={actor.id} actorKind={actor.kind} chatBackground={profile?.cosmetics.chatBackground ?? "paper"} />;
}
