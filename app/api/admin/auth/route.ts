import { NextResponse } from "next/server";
import { adminCookie, isValidAdminPassword, sessionValue } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const body = isFormSubmit ? await request.formData() : await request.json().catch(() => ({}));
  const password = body instanceof FormData ? body.get("password") : body.password;
  if (!isValidAdminPassword(typeof password === "string" ? password : "")) {
    if (isFormSubmit) return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), { status: 303 });
    return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
  }
  const response = isFormSubmit
    ? NextResponse.redirect(new URL("/admin", request.url), { status: 303 })
    : NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, sessionValue(), adminCookie.options);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, "", { ...adminCookie.options, maxAge: 0 });
  return response;
}
