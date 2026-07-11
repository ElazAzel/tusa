import { auth } from "@clerk/nextjs/server";
import { getPartyByInvite, getPartyMembers, setMemberRole } from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { inviteCode } = await params;
  const party = await getPartyByInvite(inviteCode);
  if (!party) return Response.json({ error: "Not found" }, { status: 404 });
  const members = await getPartyMembers(party.id);
  return Response.json({ members });
}

export async function PUT(request: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { inviteCode } = await params;
  const party = await getPartyByInvite(inviteCode);
  if (!party) return Response.json({ error: "Not found" }, { status: 404 });
  const body = await request.json();
  try {
    const result = await setMemberRole(party.id, userId, body.targetUserId, body.role);
    if (!result) return Response.json({ error: "Cannot update role" }, { status: 400 });
    return Response.json({ member: result });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Cannot update role" }, { status: 400 });
  }
}
