import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/guest-session";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { operationalEventTypes, recordOperationalEvent } from "@/lib/operations";

const schema = z.object({
  eventType: z.enum(operationalEventTypes),
  durationMs: z.number().int().min(0).max(300_000).optional(),
  success: z.boolean().optional(),
  dimensions: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
}).strict();

export async function POST(request: Request) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const limit = await distributedRateLimit(`telemetry:operations:${actor.id}:${getClientIp(request.headers)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  await recordOperationalEvent(parsed.data);
  return new NextResponse(null, { status: 204 });
}
