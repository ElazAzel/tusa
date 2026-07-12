import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getActivePartyPassSeason, getUserPassProgress, addPassXp } from "@/lib/parties";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tusa.game", "https://www.tusa.game"];

function cors(res: NextResponse) { res.headers.set("Access-Control-Allow-Origin", "*"); res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "*"); return res; }

export async function OPTIONS() { return cors(NextResponse.json({})); }

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:pass`, 30, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  try {
    const [season, progress] = await Promise.all([getActivePartyPassSeason(), getUserPassProgress(userId)]);
    return cors(NextResponse.json({ season, progress }));
  } catch { return cors(NextResponse.json({ error: "Ошибка загрузки." }, { status: 500 })); }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:pass`, 30, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  try {
    const { action, amount } = await request.json();
    if (action === "addXp" && amount > 0) {
      const progress = await addPassXp(userId, amount);
      return cors(NextResponse.json({ progress }));
    }
    return cors(NextResponse.json({ error: "Invalid action." }, { status: 400 }));
  } catch { return cors(NextResponse.json({ error: "Ошибка." }, { status: 500 })); }
}
