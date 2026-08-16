import { auth, currentUser } from "@/lib/local-auth/server";
import { NextResponse } from "next/server";
import { distributedRateLimit } from "@/lib/rate-limit";
import { createPartyWithPromo, deleteParty, getDashboard, syncProfile, trackAnalytics, updateParty } from "@/lib/parties";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:parties`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  return NextResponse.json({ parties: await getDashboard(userId) });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:parties`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  const required = ["title", "date", "time", "venue", "category"] as const;
  if (!required.every((field) => typeof body[field] === "string" && body[field].trim())) {
    return NextResponse.json({ error: "Заполните название, дату, время, место и формат." }, { status: 400 });
  }
  await syncProfile({ id: userId, displayName: user.fullName ?? user.firstName ?? "TUSA friend", imageUrl: user.imageUrl });
  try {
    const result = await createPartyWithPromo(userId, {
      title: body.title,
      date: body.date,
      time: body.time,
      venue: body.venue,
      category: body.category,
      description: typeof body.description === "string" ? body.description : "",
      promoCode: typeof body.promoCode === "string" && body.promoCode.trim() ? body.promoCode : undefined,
      adultOnly: body.adultOnly === true || body.adultOnly === "on",
    });
    if (result.kind === "created") { trackAnalytics(userId, "party_created", { partyId: result.party.id, category: body.category }); return NextResponse.json(result, { status: 201 }); }
    const message = result.kind === "used" ? "Вы уже использовали этот промокод. Напишите администратору в WhatsApp: +7 700 020 47 91." : result.kind === "exhausted" ? "Этот промокод уже использован. Напишите администратору в WhatsApp: +7 700 020 47 91." : result.kind === "no_access" ? "Нужен промокод для создания туcы." : "Промокод не найден или отключён.";
    return NextResponse.json({ error: message, reason: result.kind }, { status: 409 });
  } catch {
    return NextResponse.json({ error: "Не удалось создать тусу. Попробуйте ещё раз." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:parties`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "Укажите ID тусы." }, { status: 400 });
  try {
    const party = await updateParty(body.id, userId, {
      title: body.title, date: body.date, time: body.time, venue: body.venue,
      category: body.category, description: body.description, adultOnly: body.adultOnly,
    });
    if (!party) return NextResponse.json({ error: "Туса не найдена или нет прав." }, { status: 404 });
    return NextResponse.json({ party });
  } catch { return NextResponse.json({ error: "Не удалось обновить тусу." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:parties`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "Укажите ID тусы." }, { status: 400 });
  const ok = await deleteParty(body.id, userId);
  if (!ok) return NextResponse.json({ error: "Туса не найдена или нет прав." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
