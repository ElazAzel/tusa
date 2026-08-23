import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getUserRedemptions, redeemPromo, syncProfile, trackAnalytics } from "@/lib/parties";

export async function POST(request: Request) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:promos:redeem`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.code !== "string" || !body.code.trim()) return NextResponse.json({ error: "Введите промокод." }, { status: 400 });
  await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
  const result = await redeemPromo(userId, body.code);
  if (result.kind === "redeemed") { trackAnalytics(userId, "promo_redeemed", { code: body.code }); return NextResponse.json(result, { status: 201 }); }
  const message = result.kind === "used" ? "Этот код уже привязан к вашему профилю." : result.kind === "exhausted" ? "Лимит этого кода закончился." : "Код не найден, отключён или уже истёк.";
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:promos:redeem`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const redemptions = await getUserRedemptions(userId);
  return NextResponse.json({ redemptions });
}
