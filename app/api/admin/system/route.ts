import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import { getRuntimeStatus } from "@/lib/runtime-status";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { getDatabaseHealth, getPlatformErrorSummary } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.permissions.includes("system_read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = await distributedRateLimit(`admin:system:${access.clerkUserId}:${getClientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const [database, errors] = await Promise.all([
    getDatabaseHealth().catch(() => ({ ready: false, schemaVersion: 0, latencyMs: 0, appliedAt: null })),
    getPlatformErrorSummary().catch(() => ({ lastHour: 0, last24Hours: 0, latestAt: null, top: [] })),
  ]);
  return NextResponse.json(
    { checkedAt: new Date().toISOString(), runtime: getRuntimeStatus(), database, errors },
    { headers: { "Cache-Control": "no-store" } },
  );
}
