import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getPartyByInvite, updatePartyTheme } from "@/lib/parties";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tusa.game", "https://www.tusa.game"];

function cors(res: NextResponse, origin: string | null) { const allowed = ALLOWED_ORIGINS.includes(origin ?? ""); if (allowed) res.headers.set("Access-Control-Allow-Origin", origin!); res.headers.set("Access-Control-Allow-Methods", "PATCH,OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "*"); return res; }

export async function OPTIONS(request: NextRequest) { const origin = request.headers.get("origin"); return cors(NextResponse.json({}), origin); }

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { userId } = await auth();
  const origin = request.headers.get("origin");
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }), origin);
  const { inviteCode } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:theme`, 10, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }), origin);
  const body = await request.json().catch(() => ({}));
  if (!body.theme || typeof body.theme !== "object") return cors(NextResponse.json({ error: "Укажите theme." }, { status: 400 }), origin);
  try {
    const party = await getPartyByInvite(inviteCode);
    if (!party) return cors(NextResponse.json({ error: "Туса не найдена." }, { status: 404 }), origin);
    const result = await updatePartyTheme(party.id, userId, body.theme, body.themeId);
    return cors(NextResponse.json(result), origin);
  } catch (e) { return cors(NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка." }, { status: 403 }), origin); }
}
