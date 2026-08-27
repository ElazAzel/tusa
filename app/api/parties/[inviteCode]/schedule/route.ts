import { auth } from "@/lib/local-auth/server";
import { NextRequest, NextResponse } from "next/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPartyByInvite, scheduleParty } from "@/lib/parties";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tusagame.vercel.app", "https://tusa.game", "https://www.tusa.game"];

function cors(res: NextResponse, origin: string | null) { const allowed = ALLOWED_ORIGINS.includes(origin ?? ""); if (allowed) res.headers.set("Access-Control-Allow-Origin", origin!); res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "*"); return res; }

export async function OPTIONS(request: NextRequest) { const origin = request.headers.get("origin"); return cors(NextResponse.json({}), origin); }

export async function POST(request: NextRequest, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { userId } = await auth();
  const origin = request.headers.get("origin");
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }), origin);
  const { inviteCode } = await params;
  const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:schedule`, 5, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }), origin);
  const body = await request.json().catch(() => ({}));
  if (!body.scheduledAt) return cors(NextResponse.json({ error: "Укажите scheduledAt." }, { status: 400 }), origin);
  try {
    const party = await getPartyByInvite(inviteCode);
    if (!party) return cors(NextResponse.json({ error: "Туса не найдена." }, { status: 404 }), origin);
    const result = await scheduleParty(party.id, userId, body.scheduledAt);
    return cors(NextResponse.json({ scheduled: result }), origin);
  } catch (e) { return cors(NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка." }, { status: 403 }), origin); }
}
