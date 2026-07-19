import { NextResponse } from "next/server";
import { verifyEmail } from "@/lib/local-auth/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const verified = token.length >= 32 && await verifyEmail(token);
  return NextResponse.redirect(new URL(verified ? "/app?email=verified" : "/app?email=invalid", request.url), { status: 303 });
}
