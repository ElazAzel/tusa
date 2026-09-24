import { z } from "zod";
import { resolveActor } from "@/lib/guest-session";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { createBet, getBets, joinBet, settleBet, cancelBet, getKoinsBalance, getKoinsTransactions, requirePartyMember } from "@/lib/parties";
import { publish } from "@/lib/live";

export const dynamic = "force-dynamic";

const betCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), partyId: z.string().uuid(), text: z.string().trim().min(1).max(300), options: z.array(z.string().trim().min(1).max(80)).min(2).max(6) }).strict(),
  z.object({ action: z.literal("join"), partyId: z.string().uuid(), betId: z.string().uuid(), option: z.string().min(1).max(80), stake: z.number().int().min(1).max(100_000) }).strict(),
  z.object({ action: z.literal("settle"), partyId: z.string().uuid(), betId: z.string().uuid(), winner: z.string().min(1).max(80) }).strict(),
  z.object({ action: z.literal("cancel"), partyId: z.string().uuid(), betId: z.string().uuid() }).strict(),
]);

export async function GET(request: Request) {
  try {
    const actor = await resolveActor();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const userId = actor.id;
    const rl = await distributedRateLimit(`api:koins:${userId}:${getClientIp(request.headers)}`, 60, 60000);
    if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");
    const action = searchParams.get("action") || "bets";
    if (action === "balance") {
      const balance = await getKoinsBalance(userId);
      const transactions = await getKoinsTransactions(userId);
      return Response.json({ balance, transactions });
    }
    if (!partyId || !z.string().uuid().safeParse(partyId).success) return Response.json({ error: "partyId required" }, { status: 400 });
    try {
      await requirePartyMember(partyId, userId);
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const bets = await getBets(partyId);
    return Response.json({ bets });
  } catch { return Response.json({ error: "Koins error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = actor.id;
  const rl = await distributedRateLimit(`api:koins:${userId}:${getClientIp(request.headers)}`, 20, 60000);
  if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
  const parsed = betCommandSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid bet request.", details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  try {
    await requirePartyMember(body.partyId, userId);
    const bet = body.action === "create" ? await createBet(userId, body.partyId, { text: body.text, options: body.options })
      : body.action === "join" ? await joinBet(userId, body.betId, body.option, body.stake)
        : body.action === "settle" ? await settleBet(userId, body.betId, body.winner)
          : await cancelBet(userId, body.betId);
    publish(`party:${body.partyId}`, { type: "koins:updated", action: body.action, betId: bet && typeof bet === "object" && "id" in bet ? bet.id : undefined });
    return Response.json({ bet });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: /member/i.test(message) ? "Not a party member." : message }, { status: /member/i.test(message) ? 403 : 400 });
  }
}
