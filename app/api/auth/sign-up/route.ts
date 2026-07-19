import { NextResponse } from "next/server";
import { register, requestEmailVerification, sessionCookie } from "@/lib/local-auth/server";
import { deliverAuthEmail } from "@/lib/auth-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await register({ email: String(body.email ?? ""), password: String(body.password ?? ""), name: String(body.name ?? "") });
    const verification = await requestEmailVerification(user.id);
    let verificationUrl = "";
    if (verification) {
      verificationUrl = new URL(`/api/auth/email-verification/confirm?token=${encodeURIComponent(verification.token)}`, request.url).toString();
      await deliverAuthEmail({ template: "email-verification", to: verification.email, name: verification.name, verificationUrl, expiresInHours: 24 });
    }
    const response = NextResponse.json({ user, ...(process.env.NODE_ENV !== "production" && verificationUrl ? { verificationUrl } : {}) }, { status: 201 });
    const cookie = await sessionCookie(user.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось создать аккаунт." }, { status: 400 });
  }
}
