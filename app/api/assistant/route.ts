import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeLocale } from "@/lib/i18n";
import { searchPublicCorpus } from "@/lib/knowledge/public-corpus";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";
import type { RagAnswer } from "@/lib/knowledge/types";

const requestSchema = z.object({ question: z.string().trim().min(3).max(800), locale: z.enum(["ru", "en"]).optional() }).strict();

export async function POST(request: NextRequest) {
  const rl = await distributedRateLimit(`assistant:${getClientIp(request.headers)}`, 15, 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many assistant requests." }, { status: 429 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid assistant request.", details: parsed.error.flatten() }, { status: 400 });
  const locale = normalizeLocale(parsed.data.locale ?? request.headers.get("accept-language"));
  const citations = searchPublicCorpus(parsed.data.question, locale, 3);
  const confidence = citations.length === 0 ? 0 : Math.min(0.95, 0.45 + citations[0].score / 4);
  const answer = citations.length === 0
    ? (locale === "ru" ? "В публичной базе TUSA.game пока нет надёжного ответа на этот вопрос." : "The public TUSA.game knowledge base does not yet have a reliable answer to that question.")
    : citations.slice(0, 2).map((hit) => `${hit.text} ${hit.citationLabel}`).join("\n\n");
  const response: RagAnswer = { answer, locale, citations, confidence: Number(confidence.toFixed(2)), requestId: randomUUID() };
  return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
}
