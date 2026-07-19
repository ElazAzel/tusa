import { NextResponse } from "next/server";
import { auth, clearedSessionCookie, revokeAllSessions } from "@/lib/local-auth/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await revokeAllSessions(userId);
  const cookie = clearedSessionCookie();
  const response = NextResponse.json({ revoked: true });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
