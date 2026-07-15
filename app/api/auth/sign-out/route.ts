import { NextResponse } from "next/server";
import { clearedSessionCookie } from "@/lib/local-auth/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const cookie = clearedSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
