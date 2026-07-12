import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { updateProfile } from "@/lib/parties";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:profile`, 10, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  const body = await request.json().catch(() => ({}));
  if (![body.displayName, body.handle].every((value) => typeof value === "string" && value.trim())) {
    return NextResponse.json({ error: "Укажите имя и ник." }, { status: 400 });
  }
  try {
    const profile = await updateProfile(userId, {
      displayName: body.displayName,
      handle: body.handle,
      city: typeof body.city === "string" ? body.city : "",
      bio: typeof body.bio === "string" ? body.bio : "",
      compashka: typeof body.compashka === "string" ? body.compashka : "",
      cosmetics: Object.fromEntries(Object.entries({ cover: body.cover, avatarFrame: body.avatarFrame, chatEffect: body.chatEffect, nameColor: body.nameColor, badge: body.badge }).filter(([, value]) => typeof value === "string")),
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Этот ник уже занят." }, { status: 409 });
  }
}
