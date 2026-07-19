import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { confirmAdminMfaEnrollment } from "@/lib/admin-mfa";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (!access || access.source !== "root") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const limit = await distributedRateLimit(`admin:mfa:confirm:${getClientIp(request.headers)}`, 5, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { code?: string };
  const recoveryCodes = await confirmAdminMfaEnrollment("root", body.code ?? "");
  if (!recoveryCodes) return NextResponse.json({ error: "Invalid authenticator code" }, { status: 400 });
  return NextResponse.json({ recoveryCodes }, { headers: { "Cache-Control": "no-store" } });
}
