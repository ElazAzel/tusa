import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin-auth";
import { WAITLIST_STATUSES, deleteWaitlistApplication, getWaitlistStats, listWaitlistApplications, updateWaitlistApplication } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Нужен вход администратора." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!(await isAdmin("waitlist_read"))) return unauthorized();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin:waitlist`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  try {
    const [stats, applications] = await Promise.all([getWaitlistStats(), listWaitlistApplications()]);
    return NextResponse.json({ stats, applications }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить заявки." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin("waitlist_write"))) return unauthorized();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin:waitlist`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : undefined;
  const status = WAITLIST_STATUSES.includes(body.status) ? body.status : undefined;
  if (!id || (!status && notes === undefined)) return NextResponse.json({ error: "Нечего обновлять." }, { status: 400 });
  const application = await updateWaitlistApplication(id, { status, notes });
  if (!application) return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  return NextResponse.json({ application, stats: await getWaitlistStats() });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin("waitlist_write"))) return unauthorized();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin:waitlist`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string") return NextResponse.json({ error: "Нужен id заявки." }, { status: 400 });
  const deleted = await deleteWaitlistApplication(body.id);
  return NextResponse.json({ deleted, stats: await getWaitlistStats() });
}
