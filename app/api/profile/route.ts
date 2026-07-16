import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { updateProfile } from "@/lib/parties";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  handle: z.string().trim().min(3).max(24),
  city: z.string().max(80).optional(),
  bio: z.string().max(300).optional(),
  compashka: z.string().max(80).optional(),
  cover: z.string().max(80).optional(),
  avatarFrame: z.string().max(80).optional(),
  chatEffect: z.string().max(80).optional(),
  chatBackground: z.string().max(80).optional(),
  nameColor: z.string().max(80).optional(),
  badge: z.string().max(80).optional(),
  imageUrl: z.string().max(1_500_000).optional(),
}).strict();

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`api:${ip}:profile`, 10, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your profile fields and try again." }, { status: 400 });
  const body = parsed.data;
  try {
    const profile = await updateProfile(userId, {
      displayName: body.displayName,
      handle: body.handle,
      city: body.city ?? "",
      bio: body.bio ?? "",
      imageUrl: body.imageUrl,
      compashka: body.compashka ?? "",
      cosmetics: Object.fromEntries(Object.entries({
        cover: body.cover,
        avatarFrame: body.avatarFrame,
        chatEffect: body.chatEffect,
        chatBackground: body.chatBackground,
        nameColor: body.nameColor,
        badge: body.badge,
      }).filter(([, value]) => typeof value === "string")),
    });
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save profile.";
    const status = /not unlocked|Unknown cosmetic/i.test(message) ? 403 : /unique|already/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
