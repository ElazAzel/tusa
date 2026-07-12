import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPartyByInvite, getPartyMembers, requirePartyMember, setMemberRole } from "@/lib/parties";
import { resolveActor } from "@/lib/guest-session";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const actor = await resolveActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await distributedRateLimit(`party:members:read:${actor.id}:${getClientIp(_request.headers)}`, 60, 60000);
  if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
  const { inviteCode } = await params;
  const party = await getPartyByInvite(inviteCode);
  if (!party) return Response.json({ error: "Not found" }, { status: 404 });
  try { await requirePartyMember(party.id, actor.id); } catch { return Response.json({ error: "Forbidden" }, { status: 403 }); }
  const members = await getPartyMembers(party.id);
  return Response.json({ members });
}

export async function PUT(request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const actor = await resolveActor();
  if (!actor) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await distributedRateLimit(`party:members:write:${actor.id}:${getClientIp(request.headers)}`, 10, 60000);
  if (!rl.allowed) return Response.json({ error: "Слишком много запросов." }, { status: 429 });
  const { inviteCode } = await params;
  const party = await getPartyByInvite(inviteCode);
  if (!party) return Response.json({ error: "Not found" }, { status: 404 });
  const body = await request.json();
  try {
    const result = await setMemberRole(party.id, actor.id, body.targetUserId, body.role);
    if (!result) return Response.json({ error: "Cannot update role" }, { status: 400 });
    return Response.json({ member: result });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Cannot update role" }, { status: 400 });
  }
}
