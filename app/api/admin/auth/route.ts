import { NextResponse } from "next/server";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { adminCookie, isAdminMfaConfigured, isValidAdminPassword, sessionValue, verifyRootAdminSecondFactor } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const rl = await distributedRateLimit(`admin:auth:${getClientIp(request.headers)}`, 5, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  if (!await isAdminMfaConfigured()) {
    if (isFormSubmit) return NextResponse.redirect(new URL("/admin/login?error=mfa-required", request.url), { status: 303 });
    return NextResponse.json({ error: "Admin MFA is not configured." }, { status: 503 });
  }
  const body = isFormSubmit ? await request.formData() : await request.json().catch(() => ({}));
  const password = body instanceof FormData ? body.get("password") : body.password;
  const totp = body instanceof FormData ? body.get("totp") : body.totp;
  const recoveryCode = body instanceof FormData ? body.get("recoveryCode") : body.recoveryCode;
  const valid = isValidAdminPassword(typeof password === "string" ? password : "")
    && await verifyRootAdminSecondFactor(typeof totp === "string" ? totp : "", typeof recoveryCode === "string" ? recoveryCode : "");
  if (!valid) {
    if (isFormSubmit) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), { status: 303 });
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const response = isFormSubmit
    ? NextResponse.redirect(new URL("/admin", request.url), { status: 303 })
    : NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, sessionValue(), adminCookie.options);
  return response;
}

export async function DELETE(request: Request) {
  const rl = await distributedRateLimit(`admin:auth:${getClientIp(request.headers)}`, 5, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, "", { ...adminCookie.options, maxAge: 0 });
  return response;
}
