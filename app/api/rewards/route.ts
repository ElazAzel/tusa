import { resolveActor } from "@/lib/guest-session";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { grantEngagementReward, getEngagementStats, requirePartyMember } from "@/lib/parties";
import { z } from "zod";

export const dynamic = "force-dynamic";

const checkInSchema = z.object({ activity: z.literal("streak"), partyId: z.string().uuid() }).strict();

export async function GET(request: Request) {
  try {
    const actor = await resolveActor();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const rl = await distributedRateLimit(`api:rewards:${actor.id}:${getClientIp(request.headers)}`, 60, 60000);
    if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
    const stats = await getEngagementStats(actor.id);
    return Response.json({ stats });
  } catch { return Response.json({ error: "Rewards error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const actor = await resolveActor();
    if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const rl = await distributedRateLimit(`api:rewards:${actor.id}:${getClientIp(request.headers)}`, 10, 60000);
    if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
    const parsed = checkInSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Only the daily check-in can be claimed by the client." }, { status: 400 });
    await requirePartyMember(parsed.data.partyId, actor.id);
    const result = await grantEngagementReward(actor.id, "streak", parsed.data.partyId);
    return Response.json(result);
  } catch (error) {
    const forbidden = error instanceof Error && /member/i.test(error.message);
    return Response.json({ error: forbidden ? "Not a party member." : "Rewards error" }, { status: forbidden ? 403 : 500 });
  }
}
