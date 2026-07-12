import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSocialQuests, getQuestProgress, claimQuestReward, requirePartyMember } from "@/lib/parties";
import { publish } from "@/lib/live";
import { resolveActor } from "@/lib/guest-session";

const claimSchema = z.object({ action: z.literal("claim"), questId: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/i), partyId: z.string().uuid() }).strict();

export async function GET(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`quests:read:${actor.id}:${getClientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const partyId = request.nextUrl.searchParams.get("partyId");
  if (!partyId || !z.string().uuid().safeParse(partyId).success) return NextResponse.json({ error: "A valid partyId is required." }, { status: 400 });
  await requirePartyMember(partyId, actor.id);
  const [quests, progress] = await Promise.all([getSocialQuests(), getQuestProgress(partyId, actor.id)]);
  return NextResponse.json({ quests, progress });
}

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`quests:claim:${actor.id}:${getClientIp(request.headers)}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = claimSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid claim.", details: parsed.error.flatten() }, { status: 400 });
  await requirePartyMember(parsed.data.partyId, actor.id);
  const result = await claimQuestReward(parsed.data.questId, parsed.data.partyId, actor.id);
  if (!result) return NextResponse.json({ error: "Quest is incomplete or already claimed." }, { status: 409 });
  publish(`party:${parsed.data.partyId}`, { type: "quest:claimed", questId: parsed.data.questId, userId: actor.id, result });
  return NextResponse.json({ result });
}
