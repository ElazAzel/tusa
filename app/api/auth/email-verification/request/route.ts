import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requestEmailVerification } from "@/lib/local-auth/server";
import { deliverAuthEmail } from "@/lib/auth-email";
import { distributedRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const limit = await distributedRateLimit(`email-verification:${userId}`, 3, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json({ accepted: true }, { status: 202 });
  const verification = await requestEmailVerification(userId);
  if (!verification) return NextResponse.json({ accepted: true }, { status: 202 });
  const verificationUrl = new URL(`/api/auth/email-verification/confirm?token=${encodeURIComponent(verification.token)}`, request.url).toString();
  const delivered = await deliverAuthEmail({ template: "email-verification", to: verification.email, name: verification.name, verificationUrl, expiresInHours: 24 });
  return NextResponse.json({ accepted: true, delivered, ...(process.env.NODE_ENV !== "production" ? { verificationUrl } : {}) }, { status: 202 });
}
