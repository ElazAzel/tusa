import { NextResponse } from "next/server";
import { distributedRateLimit } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin-auth";
import { PROMO_STATUS, type PromoBenefit, createPromoCode, deletePromoCode, getAdminProductStats, getPromoRedemptions, listPromoCodes, updatePromoCode } from "@/lib/parties";

const benefitTypes = new Set(["beta_access", "profile_cover", "avatar_frame", "chat_effect", "chat_background", "name_color", "badge", "xp_multiplier", "party_creation"]);
function benefits(value: unknown): PromoBenefit[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PromoBenefit => Boolean(item && typeof item === "object" && benefitTypes.has((item as PromoBenefit).type))).map((item) => ({ type: item.type, value: item.value }));
}

function denied() { return NextResponse.json({ error: "Нужен вход администратора." }, { status: 401 }); }

export async function GET(request: Request) {
  if (!(await isAdmin("promos_read"))) return denied();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:admin:promos`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const [promos, stats, redemptions] = await Promise.all([listPromoCodes(), getAdminProductStats(), getPromoRedemptions()]);
  return NextResponse.json({ promos, stats, redemptions });
}

export async function POST(request: Request) {
  if (!(await isAdmin("promos_write"))) return denied();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:admin:promos`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const maxRedemptions = body.maxRedemptions === "" || body.maxRedemptions === null ? null : Number(body.maxRedemptions);
  if (maxRedemptions !== null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) return NextResponse.json({ error: "Лимит должен быть целым числом." }, { status: 400 });
  try {
    return NextResponse.json({ promo: await createPromoCode({ code: String(body.code ?? ""), maxRedemptions, mode: body.mode === "multi" ? "multi" : "single", expiresAt: typeof body.expiresAt === "string" && body.expiresAt ? body.expiresAt : null, benefits: benefits(body.benefits) }) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось создать код." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin("promos_write"))) return denied();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:admin:promos`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string") return NextResponse.json({ error: "Нужен id промокода." }, { status: 400 });
  const code = typeof body.code === "string" && body.code.trim().length >= 3 ? body.code.trim().toUpperCase() : undefined;
  const status = PROMO_STATUS.includes(body.status) ? body.status : undefined;
  const maxRedemptions = body.maxRedemptions === undefined ? undefined : body.maxRedemptions === null ? null : Number(body.maxRedemptions);
  if (maxRedemptions !== undefined && maxRedemptions !== null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) return NextResponse.json({ error: "Некорректный лимит." }, { status: 400 });
  const promo = await updatePromoCode(body.id, { code, status, maxRedemptions, mode: body.mode === "multi" ? "multi" : body.mode === "single" ? "single" : undefined, expiresAt: body.expiresAt === undefined ? undefined : body.expiresAt || null, benefits: body.benefits === undefined ? undefined : benefits(body.benefits) });
  if (!promo) return NextResponse.json({ error: "Промокод не найден." }, { status: 404 });
  return NextResponse.json({ promo });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin("promos_write"))) return denied();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:admin:promos`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const deleted = typeof body.id === "string" && await deletePromoCode(body.id);
  if (!deleted) return NextResponse.json({ error: "Код с применениями нельзя удалить — поставьте на паузу." }, { status: 409 });
  return NextResponse.json({ deleted: true });
}
