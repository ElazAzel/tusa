import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAccess } from "@/lib/admin-auth";
import { listSafetyReports, moderateSafetyReport } from "@/lib/parties";

const actionSchema = z.object({ reportId: z.string().uuid(), action: z.enum(["review", "dismiss", "remove_content", "warn", "suspend"]), note: z.string().max(500).default("") }).strict();

export async function GET(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.permissions.includes("moderation_read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const requested = request.nextUrl.searchParams.get("status");
  const status = ["open", "reviewing", "actioned", "dismissed", "appealed"].includes(requested ?? "") ? requested as "open" | "reviewing" | "actioned" | "dismissed" | "appealed" : undefined;
  return NextResponse.json({ reports: await listSafetyReports(status), access }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.permissions.includes("moderation_write")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  try {
    return NextResponse.json({ report: await moderateSafetyReport(parsed.data.reportId, access.clerkUserId, parsed.data.action, parsed.data.note) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Moderation failed." }, { status: 400 });
  }
}
