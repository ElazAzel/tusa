import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { joinParty, syncProfile } from "@/lib/parties";

export async function POST(request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const { inviteCode } = await params;
  const body = await request.json().catch(() => ({}));
  await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
  const party = await joinParty(userId, inviteCode, body.rsvp);
  if (!party) return NextResponse.json({ error: "Инвайт не найден." }, { status: 404 });
  return NextResponse.json({ party });
}
