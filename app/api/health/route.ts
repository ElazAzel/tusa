import { NextResponse } from "next/server";
import { getDatabaseHealth } from "@/lib/observability";
import { getRuntimeStatus } from "@/lib/runtime-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = getRuntimeStatus();
  try {
    const database = await Promise.race([
      getDatabaseHealth(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Health check timed out.")), 4_000)),
    ]);
    const ready = database.ready && runtime.overall !== "blocked";
    return NextResponse.json(
      { status: ready ? "ready" : "degraded", checkedAt: new Date().toISOString(), database, services: runtime.services },
      { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "blocked", checkedAt: new Date().toISOString(), database: { ready: false }, services: runtime.services },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
