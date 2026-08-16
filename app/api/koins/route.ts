import { auth } from "@/lib/local-auth/server";
import { distributedRateLimit } from "@/lib/rate-limit";
import { createBet, getBets, joinBet, settleBet, cancelBet, getKoinsBalance, getKoinsTransactions } from "@/lib/parties";
import { publish } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = await distributedRateLimit(`api:${ip}:koins`, 60, 60000);
    if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");
    const action = searchParams.get("action") || "bets";
    if (action === "balance") {
      const balance = await getKoinsBalance(userId);
      const transactions = await getKoinsTransactions(userId);
      return Response.json({ balance, transactions });
    }
    if (!partyId) return Response.json({ error: "partyId required" }, { status: 400 });
    const bets = await getBets(partyId);
    return Response.json({ bets });
  } catch { return Response.json({ error: "Koins error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:koins`, 10, 60000);
  if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json();
  try {
    if (body.action === "create") {
      const bet = await createBet(userId, body.partyId, { text: body.text, options: body.options });
      publish(`koins:${body.partyId}`, { action: "create", bet });
      return Response.json({ bet });
    }
    if (body.action === "join") {
      const bet = await joinBet(userId, body.betId, body.option, body.stake);
      publish(`koins:${body.partyId}`, { action: "join", bet });
      return Response.json({ bet });
    }
    if (body.action === "settle") {
      const bet = await settleBet(userId, body.betId, body.winner);
      publish(`koins:${body.partyId}`, { action: "settle", bet });
      return Response.json({ bet });
    }
    if (body.action === "cancel") {
      const bet = await cancelBet(userId, body.betId);
      publish(`koins:${body.partyId}`, { action: "cancel", bet });
      return Response.json({ bet });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
