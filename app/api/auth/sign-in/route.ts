import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookie, signIn } from "@/lib/local-auth/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(512),
}).strict();

export async function POST(request: Request) {
  try {
    const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    const email = parsed.data.email.toLowerCase();
    const [ipLimit, accountLimit] = await Promise.all([
      distributedRateLimit(`auth:sign-in:ip:${getClientIp(request.headers)}`, 12, 15 * 60_000),
      distributedRateLimit(`auth:sign-in:email:${email}`, 8, 15 * 60_000),
    ]);
    if (!ipLimit.allowed || !accountLimit.allowed) return NextResponse.json({ error: "Try again later." }, { status: 429 });
    const user = await signIn({ email, password: parsed.data.password });
    const response = NextResponse.json({ user });
    const cookie = await sessionCookie(user.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }
}
