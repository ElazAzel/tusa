import { NextResponse } from "next/server";
import { sessionCookie, signIn } from "@/lib/local-auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await signIn({ email: String(body.email ?? ""), password: String(body.password ?? "") });
    const response = NextResponse.json({ user });
    const cookie = sessionCookie(user.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось выполнить вход." }, { status: 400 });
  }
}
