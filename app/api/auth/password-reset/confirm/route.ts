import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword, sessionCookie } from "@/lib/local-auth/server";

const schema = z.object({ token: z.string().min(32).max(256), password: z.string().min(10).max(128) }).strict();

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Проверьте ссылку и новый пароль." }, { status: 400 });
    const userId = await resetPassword(parsed.data.token, parsed.data.password);
    const cookie = await sessionCookie(userId);
    const response = NextResponse.json({ reset: true });
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось сменить пароль." }, { status: 400 });
  }
}
