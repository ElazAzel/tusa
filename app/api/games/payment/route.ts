import { auth } from "@/lib/local-auth/server";
import { NextRequest, NextResponse } from "next/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPaymentAssignee, setPaymentAssignee, requirePartyMember } from "@/lib/parties";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
    const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:games:payment`, 60, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
    const partyId = request.nextUrl.searchParams.get("partyId");
    if (!partyId) return NextResponse.json({ error: "Укажите partyId." }, { status: 400 });
    try {
      await requirePartyMember(partyId, userId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const assignee = await getPaymentAssignee(partyId);
    return NextResponse.json(assignee);
  } catch { return NextResponse.json({ error: "Payment error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
    const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:games:payment`, 10, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
    const body = await request.json().catch(() => ({}));
    if (!body.partyId || !body.targetUserId) return NextResponse.json({ error: "Укажите partyId и targetUserId." }, { status: 400 });
    const result = await setPaymentAssignee(body.partyId, userId, body.targetUserId);
    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: "Payment error" }, { status: 500 }); }
}
