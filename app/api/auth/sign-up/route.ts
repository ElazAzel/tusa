import { NextResponse } from "next/server";
import { register, sessionCookie } from "@/lib/local-auth/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await register({ email: String(body.email ?? ""), password: String(body.password ?? ""), name: String(body.name ?? "") });
    const response = NextResponse.json({ user }, { status: 201 });
    const cookie = sessionCookie(user.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось создать аккаунт." }, { status: 400 });
  }
}
