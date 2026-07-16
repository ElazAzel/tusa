import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { getRuntimeStatus } from "@/lib/runtime-status";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.permissions.includes("system_read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = await distributedRateLimit(`admin:system:${access.clerkUserId}:${getClientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  return NextResponse.json(
    { checkedAt: new Date().toISOString(), runtime: getRuntimeStatus() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
