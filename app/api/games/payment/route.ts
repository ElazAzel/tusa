import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getPaymentAssignee, setPaymentAssignee } from "@/lib/parties";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:games:payment`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const partyId = request.nextUrl.searchParams.get("partyId");
  if (!partyId) return NextResponse.json({ error: "Укажите partyId." }, { status: 400 });
  const assignee = await getPaymentAssignee(partyId);
  return NextResponse.json(assignee);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:games:payment`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (!body.partyId || !body.targetUserId) return NextResponse.json({ error: "Укажите partyId и targetUserId." }, { status: 400 });
  const result = await setPaymentAssignee(body.partyId, userId, body.targetUserId);
  return NextResponse.json(result);
}
