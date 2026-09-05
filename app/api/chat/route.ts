import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getMessages, sendMessage, toggleReaction, grantEngagementReward, requirePartyMember } from "@/lib/parties";
import { publish } from "@/lib/live";
import { resolveActor } from "@/lib/guest-session";
import { isManagedMediaUrl } from "@/lib/media";
import { recordPlatformError } from "@/lib/observability";

const messageSchema = z.object({
  action: z.enum(["react", "float"]).optional(),
  partyId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
  emoji: z.string().min(1).max(16).optional(),
  text: z.string().max(1000).optional(),
  type: z.enum(["text", "voice", "sticker"]).default("text"),
  voiceUrl: z.string().url().max(2048).optional(),
  stickerId: z.string().max(80).optional(),
  clientMutationId: z.string().uuid().optional(),
}).strict();

export async function GET(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rl = await distributedRateLimit(`chat:read:${actor.id}:${getClientIp(request.headers)}`, 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many chat requests." }, { status: 429 });
  const partyId = request.nextUrl.searchParams.get("partyId") ?? "";
  if (!z.string().uuid().safeParse(partyId).success) return NextResponse.json({ error: "Invalid partyId." }, { status: 400 });
  try {
    await requirePartyMember(partyId, actor.id);
    const after = request.nextUrl.searchParams.get("after") || undefined;
    const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "50");
    const messages = await getMessages(partyId, Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 100), after, actor.id);
    return NextResponse.json({ messages });
  } catch (error) {
    const forbidden = error instanceof Error && /member/i.test(error.message);
    if (!forbidden) void recordPlatformError({ source: "server", route: "/api/chat", method: "GET", error, context: { partyId } }).catch(() => undefined);
    return NextResponse.json({ error: forbidden ? "Not a party member." : "Could not load messages." }, { status: forbidden ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rl = await distributedRateLimit(`chat:write:${actor.id}:${getClientIp(request.headers)}`, 25, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many chat messages." }, { status: 429 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message.", details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const requestId = crypto.randomUUID();
  try {
    await requirePartyMember(body.partyId, actor.id);
    if (body.action === "react") {
      if (!body.messageId || !body.emoji) return NextResponse.json({ error: "messageId and emoji are required." }, { status: 400 });
      const reactions = await toggleReaction(body.messageId, actor.id, body.emoji);
      if (!reactions) return NextResponse.json({ error: "Message not found." }, { status: 404 });
      publish(`chat:${body.partyId}`, { type: "reaction", messageId: body.messageId, reactions, partyId: body.partyId });
      return NextResponse.json({ reactions });
    }

    if (body.action === "float") {
      if (!body.emoji) return NextResponse.json({ error: "emoji is required." }, { status: 400 });
      publish(`party:${body.partyId}`, { type: "reaction:float", emoji: body.emoji, userId: actor.id });
      return NextResponse.json({ ok: true });
    }

    if (body.type === "voice" && (!body.voiceUrl || !isManagedMediaUrl(body.voiceUrl))) return NextResponse.json({ error: "Voice message must use managed storage." }, { status: 400 });
    const hasPayload = Boolean(body.text?.trim()) || (body.type === "voice" && body.voiceUrl) || (body.type === "sticker" && body.stickerId);
    if (!hasPayload) return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    const mutationId = body.clientMutationId || crypto.randomUUID();
    const { message, created } = await sendMessage(actor.id, body.partyId, body.text?.trim() ?? "", { type: body.type, voiceUrl: body.voiceUrl, stickerId: body.stickerId, clientMutationId: mutationId });
    if (!message) return NextResponse.json({ message: null, ok: true });
    if (created) {
      publish(`chat:${body.partyId}`, message);
      void grantEngagementReward(actor.id, "chat", body.partyId).catch(() => undefined);
    }
    return NextResponse.json({ message, duplicate: !created }, { status: created ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send message.";
    const forbidden = /member/i.test(message);
    console.error("[api/chat] send failed", { requestId, partyId: body.partyId, actorId: actor.id, error: message });
    if (!forbidden) void recordPlatformError({ source: "server", route: "/api/chat", method: "POST", error, context: { requestId, partyId: body.partyId, type: body.type } }).catch(() => undefined);
    return NextResponse.json({ error: forbidden ? "Not a party member." : "Could not send message. Please try again.", requestId }, { status: forbidden ? 403 : 500 });
  }
}
