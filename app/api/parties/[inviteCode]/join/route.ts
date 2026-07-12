import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { joinParty, syncProfile } from "@/lib/parties";

export async function POST(request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const { inviteCode } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:parties:join`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
  const party = await joinParty(userId, inviteCode, body.rsvp);
  if (!party) return NextResponse.json({ error: "Инвайт не найден." }, { status: 404 });
  return NextResponse.json({ party });
}
