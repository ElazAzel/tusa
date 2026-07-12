import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getGratitudeTips, sendGratitudeTip, requirePartyMember } from "@/lib/parties";
import { publish } from "@/lib/live";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tusa.game", "https://www.tusa.game"];

function cors(res: NextResponse) { res.headers.set("Access-Control-Allow-Origin", "*"); res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "*"); return res; }

export async function OPTIONS() { return cors(NextResponse.json({})); }

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:gratitude`, 30, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  const partyId = request.nextUrl.searchParams.get("partyId");
  if (!partyId) return cors(NextResponse.json({ error: "Укажите partyId." }, { status: 400 }));
  try {
    const tips = await getGratitudeTips(partyId);
    return cors(NextResponse.json({ tips }));
  } catch { return cors(NextResponse.json({ error: "Ошибка загрузки." }, { status: 500 })); }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:gratitude`, 10, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  const body = await request.json().catch(() => ({}));
  if (!body.partyId || !body.toUser || !body.amount) return cors(NextResponse.json({ error: "Укажите partyId, toUser и amount." }, { status: 400 }));
  try {
    await requirePartyMember(body.partyId, userId);
    await sendGratitudeTip({ partyId: body.partyId, fromUser: userId, toUser: body.toUser, amount: body.amount, message: body.message });
    publish(`party:${body.partyId}`, { type: "gratitude:sent", fromUser: userId, toUser: body.toUser, amount: body.amount });
    return cors(NextResponse.json({ sent: true }, { status: 201 }));
  } catch (e) { return cors(NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка." }, { status: 403 })); }
}
