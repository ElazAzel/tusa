import { auth } from "@/lib/local-auth/server";
import { NextResponse } from "next/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getFriends, getFriendRequests, sendFriendRequest, respondToFriendRequest, removeFriend, resolveHandleToUserId, grantEngagementReward } from "@/lib/parties";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:friends`, 60, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") || "friends";
    if (scope === "requests") {
      const requests = await getFriendRequests(userId);
      return NextResponse.json({ requests });
    }
    const friends = await getFriends(userId);
    return NextResponse.json({ friends });
  } catch { return NextResponse.json({ error: "Friends error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:friends`, 20, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
    const body = await request.json().catch(() => ({}));
    if (body.action === "request") {
    const targetId = body.targetId;
    if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 });
    try {
      const resolvedId = await resolveHandleToUserId(targetId).then((id) => id || targetId);
      const result = await sendFriendRequest(userId, resolvedId);
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 400 });
    }
  }
  if (body.action === "respond") {
    if (!body.requesterId) return NextResponse.json({ error: "requesterId required" }, { status: 400 });
    const result = await respondToFriendRequest(userId, body.requesterId, body.accept !== false);
    if (!result) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (body.accept !== false) {
      grantEngagementReward(userId, "friend_add").catch(() => undefined);
    }
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch { return NextResponse.json({ error: "Friends error" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:friends`, 20, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
    const body = await request.json().catch(() => ({}));
    if (!body.friendId) return NextResponse.json({ error: "friendId required" }, { status: 400 });
    await removeFriend(userId, body.friendId);
    return NextResponse.json({ deleted: true });
  } catch { return NextResponse.json({ error: "Friends error" }, { status: 500 }); }
}
