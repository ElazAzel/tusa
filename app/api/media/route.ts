import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/guest-session";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import { requirePartyMember } from "@/lib/parties";
import { storeMedia } from "@/lib/media";
import { recordOperationalEvent } from "@/lib/operations";

export const runtime = "nodejs";

const partyIdSchema = z.string().uuid();

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rate = await distributedRateLimit(`media:${actor.id}:${getClientIp(request.headers)}`, 12, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: "Too many uploads." }, { status: 429 });
  try {
    const form = await request.formData();
    const partyId = String(form.get("partyId") ?? "");
    const rawKind = form.get("kind");
    if (rawKind !== "image" && rawKind !== "voice") return NextResponse.json({ error: "Invalid media kind." }, { status: 400 });
    const kind = rawKind;
    const file = form.get("file");
    const consent = form.get("consent") === "true";
    if (!partyIdSchema.safeParse(partyId).success || !(file instanceof File)) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
    if (!consent) return NextResponse.json({ error: "Media consent is required." }, { status: 400 });
    await requirePartyMember(partyId, actor.id);
    const media = await storeMedia(file, partyId, kind);
    void recordOperationalEvent({ eventType: "media_upload", durationMs: performance.now() - startedAt, dimensions: { kind, sizeBucket: file.size < 1_000_000 ? "small" : "large" } }).catch(() => undefined);
    return NextResponse.json({ media, retentionDays: 90 }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    const status = /member/i.test(message) ? 403 : /type|smaller|invalid|consent/i.test(message) ? 400 : /configured/i.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
