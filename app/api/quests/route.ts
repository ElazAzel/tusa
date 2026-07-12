import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getSocialQuests, getQuestProgress, trackQuestProgress, claimQuestReward, requirePartyMember } from "@/lib/parties";
import { publish } from "@/lib/live";

const ALLOWED_ORIGINS = ["http://localhost:3000", "https://tusa.game", "https://www.tusa.game"];

function cors(res: NextResponse) { res.headers.set("Access-Control-Allow-Origin", "*"); res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "*"); return res; }

export async function OPTIONS() { return cors(NextResponse.json({})); }

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:quests`, 30, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  const partyId = request.nextUrl.searchParams.get("partyId");
  if (!partyId) return cors(NextResponse.json({ error: "Укажите partyId." }, { status: 400 }));
  try {
    const [quests, progress] = await Promise.all([getSocialQuests(), getQuestProgress(partyId, userId)]);
    return cors(NextResponse.json({ quests, progress }));
  } catch { return cors(NextResponse.json({ error: "Ошибка загрузки." }, { status: 500 })); }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return cors(NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 }));
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:quests`, 10, 60000);
  if (!rl.allowed) return cors(NextResponse.json({ error: "Слишком много запросов." }, { status: 429 }));
  const body = await request.json().catch(() => ({}));
  if (!body.questId || !body.partyId || !body.action) return cors(NextResponse.json({ error: "Укажите questId, partyId и action." }, { status: 400 }));
  try {
    await requirePartyMember(body.partyId, userId);
    if (body.action === "claim") {
      const result = await claimQuestReward(body.questId, body.partyId, userId);
      if (!result) return cors(NextResponse.json({ error: "Награда уже получена или квест не завершён." }, { status: 409 }));
      publish(`party:${body.partyId}`, { type: "quest:claimed", questId: body.questId, userId, result });
      return cors(NextResponse.json({ result }));
    }
    if (body.action === "track") {
      const progress = await trackQuestProgress(body.questId, body.partyId, userId);
      publish(`party:${body.partyId}`, { type: "quest:progress", questId: body.questId, userId, progress });
      return cors(NextResponse.json({ progress }));
    }
    return cors(NextResponse.json({ error: "Неверный action. Используйте claim или track." }, { status: 400 }));
  } catch (e) { return cors(NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка." }, { status: 403 })); }
}
