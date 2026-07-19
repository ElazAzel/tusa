import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getGratitudeTips, sendGratitudeTip, requirePartyMember, trackQuestProgress } from "@/lib/parties";
import { publish } from "@/lib/live";
import { resolveActor } from "@/lib/guest-session";

const tipSchema = z.object({ partyId: z.string().uuid(), toUser: z.string().min(1).max(128), amount: z.number().int().min(1).max(100), message: z.string().max(240).optional() }).strict();

export async function GET(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`gratitude:read:${actor.id}:${getClientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const partyId = request.nextUrl.searchParams.get("partyId");
  if (!partyId || !z.string().uuid().safeParse(partyId).success) return NextResponse.json({ error: "A valid partyId is required." }, { status: 400 });
  await requirePartyMember(partyId, actor.id);
  return NextResponse.json({ tips: await getGratitudeTips(partyId) });
}

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`gratitude:write:${actor.id}:${getClientIp(request.headers)}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many transfers." }, { status: 429 });
  const parsed = tipSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid transfer.", details: parsed.error.flatten() }, { status: 400 });
  try {
    await sendGratitudeTip({ ...parsed.data, fromUser: actor.id });
    await trackQuestProgress("thankothers", parsed.data.partyId, actor.id);
    publish(`party:${parsed.data.partyId}`, { type: "gratitude:sent", fromUser: actor.id, toUser: parsed.data.toUser, amount: parsed.data.amount });
    return NextResponse.json({ sent: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed.";
    return NextResponse.json({ error: message }, { status: /member|yourself/i.test(message) ? 403 : 409 });
  }
}
