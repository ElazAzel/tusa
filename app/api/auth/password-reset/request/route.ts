import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/local-auth/server";
import { distributedRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email().max(320) }).strict();

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Введите корректный email." }, { status: 400 });
  const rate = await distributedRateLimit(`password-reset:${parsed.data.email.toLowerCase()}`, 4, 15 * 60_000);
  if (!rate.allowed) return NextResponse.json({ accepted: true }, { status: 202 });

  const reset = await requestPasswordReset(parsed.data.email);
  if (reset) {
    const resetUrl = new URL(`/reset-password?token=${encodeURIComponent(reset.token)}`, request.url).toString();
    if (process.env.AUTH_EMAIL_WEBHOOK_URL) {
      await fetch(process.env.AUTH_EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.AUTH_EMAIL_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.AUTH_EMAIL_WEBHOOK_SECRET}` } : {}),
        },
        body: JSON.stringify({ template: "password-reset", to: reset.email, name: reset.name, resetUrl, expiresInMinutes: 30 }),
      });
    } else if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ accepted: true, resetUrl }, { status: 202 });
    }
  }
  return NextResponse.json({ accepted: true }, { status: 202 });
}
