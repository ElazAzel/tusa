import { NextResponse } from "next/server";
import { distributedRateLimit } from "@/lib/rate-limit";
import { getAdminAccess } from "@/lib/admin-auth";
import {
  getAdminParties,
  getAdminProductStats,
  getAdminUsers,
} from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getAdminAccess();
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await distributedRateLimit(`api:${ip}:admin:data`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Слишком много запросов." }, { status: 429 });
  if (!access)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.permissions.includes("dashboard_read"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [users, parties, stats] = await Promise.all([
    access.permissions.includes("users_read")
      ? getAdminUsers()
      : Promise.resolve([]),
    access.permissions.includes("parties_read")
      ? getAdminParties()
      : Promise.resolve([]),
    getAdminProductStats(),
  ]);
  return NextResponse.json(
    { users, parties, stats, access },
    { headers: { "Cache-Control": "no-store" } },
  );
}
