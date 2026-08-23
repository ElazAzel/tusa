import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getFriendLists, createFriendList, updateFriendList, deleteFriendList, addFriendToList, removeFriendFromList } from "@/lib/parties";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:friend-lists`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const lists = await getFriendLists(userId);
  return NextResponse.json({ lists });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:friend-lists`, 20, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (body.action === "add") {
    if (!body.listId || !body.friendId) return NextResponse.json({ error: "listId and friendId required" }, { status: 400 });
    await addFriendToList(userId, body.listId, body.friendId);
    return NextResponse.json({ added: true }, { status: 201 });
  }
  if (body.action === "remove") {
    if (!body.listId || !body.friendId) return NextResponse.json({ error: "listId and friendId required" }, { status: 400 });
    await removeFriendFromList(userId, body.listId, body.friendId);
    return NextResponse.json({ removed: true });
  }
  if (body.name) {
    const list = await createFriendList(userId, body.name);
    return NextResponse.json({ list }, { status: 201 });
  }
  return NextResponse.json({ error: "name required" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:friend-lists`, 20, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (!body.listId || !body.name) return NextResponse.json({ error: "listId and name required" }, { status: 400 });
  const list = await updateFriendList(userId, body.listId, body.name);
  return NextResponse.json({ list });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = await distributedRateLimit(`api:${getClientIp(request.headers)}:friend-lists`, 20, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (!body.listId) return NextResponse.json({ error: "listId required" }, { status: 400 });
  await deleteFriendList(userId, body.listId);
  return NextResponse.json({ deleted: true });
}
