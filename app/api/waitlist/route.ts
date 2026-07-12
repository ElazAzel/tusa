import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createWaitlistApplication, getWaitlistStats } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

function clean(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`api:${ip}:waitlist`, 60, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
    return NextResponse.json(await getWaitlistStats(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить waitlist." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:waitlist`, 5, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  try {
    const body = await request.json();
    if (clean(body.company, 100)) return NextResponse.json({ error: "Заявка не принята." }, { status: 400 });
    const name = clean(body.name, 100);
    const city = clean(body.city, 100);
    const contact = clean(body.contact, 160);
    if (!name || !city || !contact) return NextResponse.json({ error: "Заполни имя, город и контакт." }, { status: 400 });

    const result = await createWaitlistApplication({ name, city, contact, beta: Boolean(body.beta) });
    if (result.kind === "duplicate") return NextResponse.json({ error: "Эта заявка уже есть в списке." }, { status: 409 });
    if (result.kind === "full") return NextResponse.json({ error: "Первая волна уже заполнена.", stats: result.stats }, { status: 409 });
    return NextResponse.json({ application: result.application, stats: result.stats }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить заявку. Попробуй ещё раз." }, { status: 500 });
  }
}
