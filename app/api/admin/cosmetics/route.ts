import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { getAdminAccess } from "@/lib/admin-auth";
import { getCosmeticsCatalogue, createCosmeticsItem, updateCosmeticsItem, deleteCosmeticsItem } from "@/lib/parties";

const itemTypes = ["cover", "avatarFrame", "chatEffect", "chatBackground", "nameColor", "badge"] as const;
const itemSchema = z.object({
  type: z.enum(itemTypes),
  slug: z.string().trim().regex(/^[a-z0-9_-]{2,64}$/),
  nameRu: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(80),
  imageUrl: z.string().max(300).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

function denied() {
  return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
}

async function accessFor(permission: "ads_read" | "ads_write") {
  const access = await getAdminAccess();
  return access?.permissions.includes(permission) ? access : null;
}

export async function GET() {
  if (!await accessFor("ads_read")) return denied();
  try {
    return NextResponse.json({ items: await getCosmeticsCatalogue() });
  } catch {
    return NextResponse.json({ error: "Failed to load cosmetics." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await accessFor("ads_write")) return denied();
  const rl = rateLimit(`api:${request.headers.get("x-forwarded-for") ?? "unknown"}:admin-cosmetics`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = itemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cosmetics item." }, { status: 400 });
  try {
    return NextResponse.json({ item: await createCosmeticsItem(parsed.data) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create cosmetics item." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!await accessFor("ads_write")) return denied();
  const rl = rateLimit(`api:${request.headers.get("x-forwarded-for") ?? "unknown"}:admin-cosmetics`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = itemSchema.partial().extend({ id: z.string().uuid(), active: z.boolean().optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cosmetics item." }, { status: 400 });
  const { id, ...data } = parsed.data;
  try {
    return NextResponse.json({ item: await updateCosmeticsItem(id, data) });
  } catch {
    return NextResponse.json({ error: "Failed to update cosmetics item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await accessFor("ads_write")) return denied();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid item id." }, { status: 400 });
  try {
    await deleteCosmeticsItem(parsed.data.id);
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete cosmetics item." }, { status: 500 });
  }
}
