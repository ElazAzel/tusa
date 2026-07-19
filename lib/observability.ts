import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { runtimeEnvironment } from "@/lib/runtime-status";

type ErrorInput = {
  source: "server" | "client" | "worker";
  route?: string;
  method?: string;
  error: unknown;
  context?: Record<string, unknown>;
};

export type PlatformErrorSummary = {
  lastHour: number;
  last24Hours: number;
  latestAt: string | null;
  top: Array<{ fingerprint: string; errorName: string; route: string; count: number; latestAt: string }>;
};

let sqlClient: ReturnType<typeof neon> | null = null;

function db() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

function cleanText(value: unknown, limit: number) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[?&](token|key|secret|password|code)=[^\s&]+/gi, "$1=[redacted]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
    .trim()
    .slice(0, limit);
}

function safeContext(value: Record<string, unknown> | undefined) {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/(token|secret|password|cookie|authorization|email)/i.test(key))
      .slice(0, 12)
      .map(([key, item]) => [cleanText(key, 80), cleanText(item, 240)]),
  );
}

function errorDetails(error: unknown) {
  if (error instanceof Error) return { name: cleanText(error.name, 80) || "Error", message: cleanText(error.message, 500) };
  return { name: "Error", message: cleanText(error, 500) || "Unknown error" };
}

export async function recordPlatformError(input: ErrorInput) {
  if (!process.env.DATABASE_URL) return;
  const route = cleanText(input.route, 240);
  const method = cleanText(input.method, 16).toUpperCase();
  const details = errorDetails(input.error);
  const fingerprint = createHash("sha256").update(`${input.source}|${route}|${details.name}|${details.message}`).digest("hex").slice(0, 24);
  await db()`INSERT INTO platform_error_events (
    id, source, fingerprint, route, method, error_name, message, context, environment, release
  ) VALUES (
    ${randomUUID()}, ${input.source}, ${fingerprint}, ${route}, ${method}, ${details.name}, ${details.message},
    ${JSON.stringify(safeContext(input.context))}::jsonb, ${runtimeEnvironment()}, ${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 40) ?? ""}
  )`;
}

export async function getPlatformErrorSummary(): Promise<PlatformErrorSummary> {
  if (!process.env.DATABASE_URL) return { lastHour: 0, last24Hours: 0, latestAt: null, top: [] };
  const [counts, rows] = await Promise.all([
    db()`SELECT
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour')::int AS last_hour,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS last_24_hours,
      MAX(created_at) AS latest_at
    FROM platform_error_events`,
    db()`SELECT fingerprint, MAX(error_name) AS error_name, MAX(route) AS route, COUNT(*)::int AS count, MAX(created_at) AS latest_at
    FROM platform_error_events
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY fingerprint
    ORDER BY count DESC, latest_at DESC
    LIMIT 8`,
  ]) as unknown as [Array<Record<string, unknown>>, Array<Record<string, unknown>>];
  const count = counts[0] ?? {};
  return {
    lastHour: Number(count.last_hour ?? 0),
    last24Hours: Number(count.last_24_hours ?? 0),
    latestAt: count.latest_at ? new Date(count.latest_at as string | Date).toISOString() : null,
    top: rows.map((row) => ({
      fingerprint: String(row.fingerprint),
      errorName: String(row.error_name),
      route: String(row.route),
      count: Number(row.count),
      latestAt: new Date(row.latest_at as string | Date).toISOString(),
    })),
  };
}

export async function getDatabaseHealth() {
  const startedAt = performance.now();
  const [row] = await db()`SELECT version, applied_at FROM platform_schema_version WHERE singleton = TRUE LIMIT 1` as unknown as Array<{ version: number; applied_at: string | Date }>;
  return {
    ready: Number(row?.version ?? 0) >= 10,
    schemaVersion: Number(row?.version ?? 0),
    latencyMs: Math.round(performance.now() - startedAt),
    appliedAt: row?.applied_at ? new Date(row.applied_at).toISOString() : null,
  };
}
