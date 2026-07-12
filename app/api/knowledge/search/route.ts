import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeLocale } from "@/lib/i18n";
import { searchPublicCorpus } from "@/lib/knowledge/public-corpus";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

const requestSchema = z.object({ query: z.string().trim().min(2).max(500), locale: z.enum(["ru", "en"]).optional(), limit: z.number().int().min(1).max(10).optional() }).strict();

export async function POST(request: NextRequest) {
  const rl = await distributedRateLimit(`knowledge:search:${getClientIp(request.headers)}`, 30, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many search requests." }, { status: 429 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search request.", details: parsed.error.flatten() }, { status: 400 });
  const locale = normalizeLocale(parsed.data.locale ?? request.headers.get("accept-language"));
  const hits = searchPublicCorpus(parsed.data.query, locale, parsed.data.limit ?? 5);
  return NextResponse.json({ query: parsed.data.query, locale, hits }, { headers: { "Cache-Control": "no-store" } });
}
