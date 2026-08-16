import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/guest-session";
import { getSafetyBlocks, setSafetyBlock } from "@/lib/parties";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({ blockedUserId: z.string().min(1).max(160), blocked: z.boolean().default(true) }).strict();

export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rate = await distributedRateLimit(`safety:blocks:read:${actor.id}`, 60, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  return NextResponse.json({ blockedUserIds: await getSafetyBlocks(actor.id) });
}

export async function POST(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rate = await distributedRateLimit(`safety:blocks:write:${actor.id}:${getClientIp(request.headers)}`, 30, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid block request." }, { status: 400 });
  try {
    return NextResponse.json(await setSafetyBlock(actor.id, parsed.data.blockedUserId, parsed.data.blocked));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Block failed." }, { status: 400 });
  }
}
