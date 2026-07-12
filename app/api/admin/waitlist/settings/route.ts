import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin-auth";
import { getWaitlistStats, updateWaitlistSettings } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!(await isAdmin("waitlist_write"))) return NextResponse.json({ error: "Нужен вход администратора." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:admin:waitlist:settings`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const capacity = Number(body.capacity);
  const baseline = Number(body.baseline);
  if (!Number.isInteger(capacity) || !Number.isInteger(baseline) || capacity < 1 || capacity > 100000 || baseline < 0 || baseline > capacity) {
    return NextResponse.json({ error: "Проверь лимит и начальную очередь." }, { status: 400 });
  }
  const current = await getWaitlistStats();
  if (baseline + current.applications > capacity) return NextResponse.json({ error: "Лимит меньше текущего числа заявок." }, { status: 400 });
  await updateWaitlistSettings({ capacity, baseline });
  return NextResponse.json({ stats: await getWaitlistStats() });
}
