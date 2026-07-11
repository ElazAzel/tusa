import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getMessages, sendMessage, toggleReaction, grantEngagementReward } from "@/lib/parties";
import { publish } from "@/lib/live";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const partyId = request.nextUrl.searchParams.get("partyId");
  if (!partyId) return NextResponse.json({ error: "Укажите partyId." }, { status: 400 });
  const after = request.nextUrl.searchParams.get("after") || undefined;
  const messages = await getMessages(partyId, 50, after);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  if (body.action === "react") {
    if (!body.messageId || !body.emoji) return NextResponse.json({ error: "Укажите messageId и emoji." }, { status: 400 });
    const reactions = await toggleReaction(body.messageId, userId, body.emoji);
    if (!reactions) return NextResponse.json({ error: "Сообщение не найдено." }, { status: 404 });
    publish(`chat:${body.partyId}`, { type: "reaction", messageId: body.messageId, reactions, partyId: body.partyId });
    return NextResponse.json({ reactions });
  }

  if (!body.partyId || !body.text?.trim() && body.type !== "voice" && body.type !== "sticker") {
    return NextResponse.json({ error: "Укажите partyId и text." }, { status: 400 });
  }
  try {
    const message = await sendMessage(userId, body.partyId, body.text?.trim() ?? "", { type: body.type, voiceUrl: body.voiceUrl, stickerId: body.stickerId });
    publish(`chat:${body.partyId}`, message);
    grantEngagementReward(userId, "chat", body.partyId).catch(() => undefined);
    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Вы не участник этой тусы." }, { status: 403 });
  }
}
