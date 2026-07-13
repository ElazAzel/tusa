import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getPartyByInvite, updatePartyTheme } from "@/lib/parties";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tusa.game", "https://www.tusa.game"];

function cors(res: NextResponse) { res.headers.set("Access-Control-Allow-Origin", "*"); res.headers.set("Access-Control-Allow-Methods", "PATCH,OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "*"); return res; }

export async function OPTIONS() { return cors(NextResponse.json({})); }

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const { inviteCode } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:theme`, 10, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  const body = await request.json().catch(() => ({}));
  if (!body.theme || typeof body.theme !== "object") return cors(NextResponse.json({ error: "Укажите theme." }, { status: 400 }));
  try {
    const party = await getPartyByInvite(inviteCode);
    if (!party) return cors(NextResponse.json({ error: "Туса не найдена." }, { status: 404 }));
    const result = await updatePartyTheme(party.id, userId, body.theme, body.themeId);
    return cors(NextResponse.json(result));
  } catch (e) { return cors(NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка." }, { status: 403 })); }
}
