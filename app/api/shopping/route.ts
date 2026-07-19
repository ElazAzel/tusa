import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { addShoppingItem, deleteShoppingItem, getShoppingItems, requirePartyMember, updateShoppingItem } from "@/lib/parties";
import { resolveActor } from "@/lib/guest-session";

const shoppingSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), partyId: z.string().uuid(), text: z.string().trim().min(1).max(200), quantity: z.number().int().min(1).max(999), unit: z.string().trim().min(1).max(10) }).strict(),
  z.object({ action: z.literal("update"), itemId: z.string().uuid(), updates: z.object({ text: z.string().trim().min(1).max(200).optional(), quantity: z.number().int().min(1).max(999).optional(), unit: z.string().trim().min(1).max(10).optional(), price: z.number().int().min(0).max(100_000_000).optional(), purchased: z.boolean().optional(), buyerId: z.string().min(1).max(128).optional() }).strict() }).strict(),
  z.object({ action: z.literal("delete"), itemId: z.string().uuid() }).strict(),
]);

export async function GET(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`shopping:read:${actor.id}:${getClientIp(request.headers)}`, 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const partyId = request.nextUrl.searchParams.get("partyId") ?? "";
  if (!z.string().uuid().safeParse(partyId).success) return NextResponse.json({ error: "A valid partyId is required." }, { status: 400 });
  try {
    await requirePartyMember(partyId, actor.id);
    return NextResponse.json({ items: await getShoppingItems(partyId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shopping list error.";
    return NextResponse.json({ error: /member/i.test(message) ? "Not a party member." : "Shopping list error." }, { status: /member/i.test(message) ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`shopping:write:${actor.id}:${getClientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = shoppingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid shopping request.", details: parsed.error.flatten() }, { status: 400 });
  try {
    if (parsed.data.action === "add") return NextResponse.json({ item: await addShoppingItem(actor.id, parsed.data.partyId, parsed.data) }, { status: 201 });
    if (parsed.data.action === "update") return NextResponse.json({ item: await updateShoppingItem(parsed.data.itemId, actor.id, parsed.data.updates) });
    await deleteShoppingItem(parsed.data.itemId, actor.id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shopping list error.";
    return NextResponse.json({ error: message }, { status: /member|owner/i.test(message) ? 403 : 500 });
  }
}
