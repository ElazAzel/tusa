import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getCosmeticsCatalogue, createCosmeticsItem, updateCosmeticsItem, deleteCosmeticsItem } from "@/lib/parties";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const items = await getCosmeticsCatalogue();
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ error: "Failed to load" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin-cosmetics`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (!body.type || !body.slug || !body.nameRu || !body.nameEn || !body.value) {
    return NextResponse.json({ error: "Missing required fields: type, slug, nameRu, nameEn, value" }, { status: 400 });
  }
  try {
    const item = await createCosmeticsItem(body);
    return NextResponse.json({ item }, { status: 201 });
  } catch { return NextResponse.json({ error: "Failed to create" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin-cosmetics`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const item = await updateCosmeticsItem(body.id, body);
    return NextResponse.json({ item });
  } catch { return NextResponse.json({ error: "Failed to update" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteCosmeticsItem(body.id);
    return NextResponse.json({ deleted: true });
  } catch { return NextResponse.json({ error: "Failed to delete" }, { status: 500 }); }
}
