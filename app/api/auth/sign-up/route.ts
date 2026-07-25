import { NextResponse } from "next/server";
import { z } from "zod";
import { register, requestEmailVerification, sessionCookie } from "@/lib/local-auth/server";
import { deliverAuthEmail } from "@/lib/auth-email";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

const registrationSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(512),
  name: z.string().trim().min(1).max(80),
}).strict();

export async function POST(request: Request) {
  try {
    const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Check your registration details." }, { status: 400 });
    const email = parsed.data.email.toLowerCase();
    const [ipLimit, emailLimit] = await Promise.all([
      distributedRateLimit(`auth:sign-up:ip:${getClientIp(request.headers)}`, 5, 60 * 60_000),
      distributedRateLimit(`auth:sign-up:email:${email}`, 2, 60 * 60_000),
    ]);
    if (!ipLimit.allowed || !emailLimit.allowed) return NextResponse.json({ error: "Try again later." }, { status: 429 });
    const user = await register({ email, password: parsed.data.password, name: parsed.data.name });
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
  } catch {
    return NextResponse.json({ error: "Could not create account." }, { status: 400 });
  }
}
