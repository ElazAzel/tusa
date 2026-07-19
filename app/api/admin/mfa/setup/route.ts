import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getAdminAccess, isValidAdminPassword } from "@/lib/admin-auth";
import { beginAdminMfaEnrollment } from "@/lib/admin-mfa";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (!access || access.source !== "root") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const limit = await distributedRateLimit(`admin:mfa:setup:${getClientIp(request.headers)}`, 3, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (!isValidAdminPassword(body.password ?? "")) return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  const enrollment = await beginAdminMfaEnrollment("root");
  const qrCodeDataUrl = await QRCode.toDataURL(enrollment.otpauthUrl, { width: 240, margin: 1, errorCorrectionLevel: "M" });
  return NextResponse.json({ secret: enrollment.secret, qrCodeDataUrl }, { headers: { "Cache-Control": "no-store" } });
}
