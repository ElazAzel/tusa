import { NextResponse } from "next/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPartyByInvite, updateRsvp } from "@/lib/parties";
import { resolveActor } from "@/lib/guest-session";

export async function POST(request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { inviteCode } = await params;
  const rl = await distributedRateLimit(`party:rsvp:${actor.id}:${getClientIp(request.headers)}`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const rsvp = body.rsvp;
  if (rsvp !== "going" && rsvp !== "maybe" && rsvp !== "pass") {
    return NextResponse.json({ error: "Укажите статус: going, maybe или pass." }, { status: 400 });
  }
  const party = await getPartyByInvite(inviteCode);
  if (!party) return NextResponse.json({ error: "Туса не найдена." }, { status: 404 });
  const result = await updateRsvp(party.id, actor.id, rsvp);
  if (!result) return NextResponse.json({ error: "Вы не участник этой тусы." }, { status: 403 });
  const updated = await getPartyByInvite(inviteCode);
  return NextResponse.json({ rsvp: result, party: updated });
}
