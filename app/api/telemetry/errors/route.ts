import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPlatformError } from "@/lib/observability";
import { distributedRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  route: z.string().max(240).default(""),
  name: z.string().max(80).default("Error"),
  message: z.string().max(500),
  digest: z.string().max(120).optional(),
}).strict();

export async function POST(request: Request) {
  const limit = await distributedRateLimit(`telemetry:error:${getClientIp(request.headers)}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid error report" }, { status: 400 });
  await recordPlatformError({
    source: "client",
    route: parsed.data.route,
    method: "CLIENT",
    error: Object.assign(new Error(parsed.data.message), { name: parsed.data.name }),
    context: { digest: parsed.data.digest ?? "" },
  }).catch(() => undefined);
  return new NextResponse(null, { status: 204 });
}
