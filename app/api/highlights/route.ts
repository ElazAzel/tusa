import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { deleteHighlight, getHighlights, requirePartyMember, saveHighlight } from "@/lib/parties";
import { publish } from "@/lib/live";
import { resolveActor } from "@/lib/guest-session";

const highlightSchema = z.object({
  partyId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  displayName: z.string().max(80).optional(),
  type: z.enum(["score", "achievement", "funny", "quote", "photo"]),
  data: z.record(z.string(), z.unknown()).optional(),
  thumbnail: z.string().max(1_500_000).optional(),
}).strict();

export async function GET(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`highlights:read:${actor.id}:${getClientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const partyId = request.nextUrl.searchParams.get("partyId") ?? "";
  if (!z.string().uuid().safeParse(partyId).success) return NextResponse.json({ error: "A valid partyId is required." }, { status: 400 });
  try {
    await requirePartyMember(partyId, actor.id);
    const requested = Number(request.nextUrl.searchParams.get("limit") ?? 20);
    const highlights = await getHighlights(partyId, Math.min(Math.max(Number.isFinite(requested) ? requested : 20, 1), 50));
    return NextResponse.json({ highlights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load highlights.";
    return NextResponse.json({ error: /member/i.test(message) ? "Not a party member." : "Could not load highlights." }, { status: /member/i.test(message) ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`highlights:write:${actor.id}:${getClientIp(request.headers)}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = highlightSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid highlight.", details: parsed.error.flatten() }, { status: 400 });
  try {
    await requirePartyMember(parsed.data.partyId, actor.id);
    const highlight = await saveHighlight({ ...parsed.data, userId: actor.id });
    publish(`party:${parsed.data.partyId}`, { type: "highlight:created", highlight });
    return NextResponse.json({ highlight }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save highlight.";
    return NextResponse.json({ error: message }, { status: /member/i.test(message) ? 403 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`highlights:delete:${actor.id}:${getClientIp(request.headers)}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "A valid id is required." }, { status: 400 });
  const deleted = await deleteHighlight(id, actor.id);
  if (!deleted) return NextResponse.json({ error: "Highlight not found." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
