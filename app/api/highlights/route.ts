import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getHighlights, saveHighlight, deleteHighlight, requirePartyMember } from "@/lib/parties";
import { publish } from "@/lib/live";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tusagame.vercel.app", "https://tusa.game", "https://www.tusa.game"];

function cors(res: NextResponse, origin: string | null) { const allowed = ALLOWED_ORIGINS.includes(origin ?? ""); if (allowed) res.headers.set("Access-Control-Allow-Origin", origin!); res.headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "*"); return res; }

export async function OPTIONS(request: NextRequest) { const origin = request.headers.get("origin"); return cors(NextResponse.json({}), origin); }

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const origin = request.headers.get("origin");
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }), origin);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:highlights`, 30, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }), origin);
  const partyId = request.nextUrl.searchParams.get("partyId");
  if (!partyId) return cors(NextResponse.json({ error: "Укажите partyId." }, { status: 400 }), origin);
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;
    const highlights = await getHighlights(partyId, limit);
    return cors(NextResponse.json({ highlights }), origin);
  } catch { return cors(NextResponse.json({ error: "Ошибка загрузки." }, { status: 500 }), origin); }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  const origin = request.headers.get("origin");
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }), origin);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:highlights`, 10, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }), origin);
  const body = await request.json().catch(() => ({}));
  if (!body.partyId || !body.type) return cors(NextResponse.json({ error: "Укажите partyId и type." }, { status: 400 }), origin);
  try {
    await requirePartyMember(body.partyId, userId);
    const highlight = await saveHighlight({ partyId: body.partyId, sessionId: body.sessionId, userId, displayName: body.displayName, type: body.type, data: body.data, thumbnail: body.thumbnail });
    if (!highlight) return cors(NextResponse.json({ error: "Не удалось сохранить." }, { status: 500 }), origin);
    publish(`party:${body.partyId}`, { type: "highlight:created", highlight });
    return cors(NextResponse.json({ highlight }, { status: 201 }), origin);
  } catch (e) { return cors(NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка." }, { status: 403 }), origin); }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  const origin = request.headers.get("origin");
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }), origin);
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:highlights`, 10, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }), origin);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return cors(NextResponse.json({ error: "Укажите id." }, { status: 400 }), origin);
  try {
    const ok = await deleteHighlight(id, userId);
    if (!ok) return cors(NextResponse.json({ error: "Не найдено." }, { status: 404 }), origin);
    publish(`party:highlight:${id}`, { type: "highlight:deleted", id });
    return cors(NextResponse.json({ deleted: true }), origin);
  } catch { return cors(NextResponse.json({ error: "Ошибка удаления." }, { status: 500 }), origin); }
}
