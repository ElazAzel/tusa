import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getOrCreateDailyChallenge, submitDailyScore, getDailyLeaderboard, addPassXp } from "@/lib/parties";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tusa.game", "https://www.tusa.game"];

function cors(res: NextResponse) { res.headers.set("Access-Control-Allow-Origin", "*"); res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "*"); return res; }

export async function OPTIONS() { return cors(NextResponse.json({})); }

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:daily`, 30, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  const game = request.nextUrl.searchParams.get("game");
  if (!game) return cors(NextResponse.json({ error: "Укажите game." }, { status: 400 }));
  try {
    const challenge = await getOrCreateDailyChallenge(game);
    if (!challenge) return cors(NextResponse.json({ error: "Не удалось создать challenge." }, { status: 500 }));
    return cors(NextResponse.json({ challenge }));
  } catch { return cors(NextResponse.json({ error: "Ошибка загрузки." }, { status: 500 })); }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:daily`, 5, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  const body = await request.json().catch(() => ({}));
  if (!body.challengeId || body.score === undefined) return cors(NextResponse.json({ error: "Укажите challengeId и score." }, { status: 400 }));
  try {
    const score = await submitDailyScore(body.challengeId, userId, body.score);
    if (!score) return cors(NextResponse.json({ error: "Не удалось сохранить результат." }, { status: 500 }));
    const pass = await addPassXp(userId, 5);
    const leaderboard = await getDailyLeaderboard(body.challengeId);
    return cors(NextResponse.json({ score, pass, leaderboard }, { status: 201 }));
  } catch { return cors(NextResponse.json({ error: "Ошибка отправки." }, { status: 500 })); }
}
