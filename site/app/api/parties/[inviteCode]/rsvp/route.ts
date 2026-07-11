import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPartyByInvite, updateRsvp } from "@/lib/parties";

export async function POST(request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const { inviteCode } = await params;
  const body = await request.json().catch(() => ({}));
  const rsvp = body.rsvp;
  if (rsvp !== "going" && rsvp !== "maybe" && rsvp !== "pass") {
    return NextResponse.json({ error: "Укажите статус: going, maybe или pass." }, { status: 400 });
  }
  const party = await getPartyByInvite(inviteCode);
  if (!party) return NextResponse.json({ error: "Туса не найдена." }, { status: 404 });
  const result = await updateRsvp(party.id, userId, rsvp);
  if (!result) return NextResponse.json({ error: "Вы не участник этой тусы." }, { status: 403 });
  const updated = await getPartyByInvite(inviteCode);
  return NextResponse.json({ rsvp: result, party: updated });
}
