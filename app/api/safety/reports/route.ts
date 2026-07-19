import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/guest-session";
import { createSafetyReport, appealSafetyReport } from "@/lib/parties";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

const reportSchema = z.object({
  action: z.literal("report").default("report"),
  partyId: z.string().uuid(),
  targetType: z.enum(["chat_message", "gallery_photo", "user"]),
  targetId: z.string().min(1).max(160),
  reason: z.enum(["spam", "harassment", "hate", "sexual", "violence", "privacy", "other"]),
  details: z.string().max(500).optional(),
}).strict();

const appealSchema = z.object({ action: z.literal("appeal"), reportId: z.string().uuid(), details: z.string().min(3).max(500) }).strict();

export async function POST(request: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rate = await distributedRateLimit(`safety:report:${actor.id}:${getClientIp(request.headers)}`, 8, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many reports." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const appeal = appealSchema.safeParse(body);
  if (appeal.success) {
    const report = await appealSafetyReport(appeal.data.reportId, actor.id, appeal.data.details);
    return report ? NextResponse.json({ report }) : NextResponse.json({ error: "Appeal is not available." }, { status: 403 });
  }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid report.", details: parsed.error.flatten() }, { status: 400 });
  try {
    const report = await createSafetyReport({ ...parsed.data, reporterId: actor.id });
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report failed.";
    return NextResponse.json({ error: message }, { status: /member/i.test(message) ? 403 : 400 });
  }
}
