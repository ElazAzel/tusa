import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getFriends, getFriendRequests, sendFriendRequest, respondToFriendRequest, removeFriend, resolveHandleToUserId, grantEngagementReward } from "@/lib/parties";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "friends";
  if (scope === "requests") {
    const requests = await getFriendRequests(userId);
    return NextResponse.json({ requests });
  }
  const friends = await getFriends(userId);
  return NextResponse.json({ friends });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!body.friendId) return NextResponse.json({ error: "friendId required" }, { status: 400 });
  await removeFriend(userId, body.friendId);
  return NextResponse.json({ deleted: true });
}
