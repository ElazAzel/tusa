import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPaymentAssignee, setPaymentAssignee } from "@/lib/parties";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const partyId = request.nextUrl.searchParams.get("partyId");
  if (!partyId) return NextResponse.json({ error: "Укажите partyId." }, { status: 400 });
  const assignee = await getPaymentAssignee(partyId);
  return NextResponse.json(assignee);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!body.partyId || !body.targetUserId) return NextResponse.json({ error: "Укажите partyId и targetUserId." }, { status: 400 });
  const result = await setPaymentAssignee(body.partyId, userId, body.targetUserId);
  return NextResponse.json(result);
}
