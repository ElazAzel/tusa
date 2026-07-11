import { auth, currentUser } from "@clerk/nextjs/server";
import { addShoppingItem, getShoppingItems, updateShoppingItem, deleteShoppingItem } from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const partyId = searchParams.get("partyId");
  if (!partyId) return Response.json({ error: "partyId required" }, { status: 400 });
  const items = await getShoppingItems(partyId);
  return Response.json({ items });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (body.action === "add") {
    const item = await addShoppingItem(userId, body.partyId, { text: body.text, quantity: body.quantity, unit: body.unit });
    return Response.json({ item });
  }
  if (body.action === "update") {
    const item = await updateShoppingItem(body.itemId, userId, body.updates);
    return Response.json({ item });
  }
  if (body.action === "delete") {
    await deleteShoppingItem(body.itemId, userId);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
