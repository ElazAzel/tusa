import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-auth";
import {
  getAdminParties,
  getAdminProductStats,
  getAdminUsers,
} from "@/lib/parties";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAdminAccess();
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
