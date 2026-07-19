import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { runtimeEnvironment } from "@/lib/runtime-status";

export const operationalEventTypes = [
  "join_attempt",
  "join_success",
  "game_start",
  "game_action",
  "round_complete",
  "reconnect_success",
  "next_game",
  "media_upload",
] as const;

export type OperationalEventType = (typeof operationalEventTypes)[number];

let sqlClient: ReturnType<typeof neon> | null = null;

function db() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

function safeDimensions(value: Record<string, unknown> | undefined) {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/(email|name|token|secret|password|cookie|content|message|answer|clue)/i.test(key))
      .slice(0, 10)
      .map(([key, item]) => [key.slice(0, 60), String(item ?? "").slice(0, 100)]),
  );
}

export async function recordOperationalEvent(input: {
  eventType: OperationalEventType;
  durationMs?: number;
  success?: boolean;
  dimensions?: Record<string, unknown>;
}) {
  if (!process.env.DATABASE_URL) return;
  const durationMs = Number.isFinite(input.durationMs) ? Math.max(0, Math.round(input.durationMs ?? 0)) : null;
  await db()`INSERT INTO platform_operational_events (
    id, event_type, duration_ms, success, dimensions, environment, release
  ) VALUES (
    ${randomUUID()}, ${input.eventType}, ${durationMs}, ${input.success !== false},
    ${JSON.stringify(safeDimensions(input.dimensions))}::jsonb, ${runtimeEnvironment()},
    ${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 40) ?? ""}
  )`;
}

export async function createEmailDelivery(input: {
  provider: string;
  providerMessageId?: string;
  template: string;
  recipient: string;
  status: "queued" | "sent" | "failed";
  errorCode?: string;
}) {
  if (!process.env.DATABASE_URL) return null;
  const id = randomUUID();
  const recipientHash = createHash("sha256").update(input.recipient.trim().toLowerCase()).digest("hex");
  await db()`INSERT INTO auth_email_deliveries (
    id, provider, provider_message_id, template, recipient_hash, status, error_code
  ) VALUES (
    ${id}, ${input.provider.slice(0, 40)}, ${input.providerMessageId ?? null}, ${input.template.slice(0, 80)},
    ${recipientHash}, ${input.status}, ${input.errorCode?.slice(0, 120) ?? null}
  )`;
  return id;
}

export async function updateEmailDelivery(providerMessageId: string, status: "sent" | "delivered" | "bounced" | "complained" | "failed") {
  if (!process.env.DATABASE_URL) return false;
  const rows = await db()`UPDATE auth_email_deliveries SET
    status = ${status}, updated_at = NOW(), delivered_at = CASE WHEN ${status} = 'delivered' THEN NOW() ELSE delivered_at END
    WHERE provider_message_id = ${providerMessageId}
    RETURNING id` as unknown as Array<{ id: string }>;
  return rows.length > 0;
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

export async function getOperationalSummary() {
  if (!process.env.DATABASE_URL) return {
    windowHours: 24, total: 0, errorRate: 0, joinSuccessRate: 0, joinP95Ms: null,
    actionP95Ms: null, reconnectP95Ms: null, gameStarts: 0, roundCompletes: 0,
    reconnects: 0, nextGames: 0, mediaUploads: 0,
  };
  const rows = await db()`SELECT event_type, duration_ms, success
    FROM platform_operational_events
    WHERE created_at >= NOW() - INTERVAL '24 hours'` as unknown as Array<{ event_type: OperationalEventType; duration_ms: number | null; success: boolean }>;
  const byType = (type: OperationalEventType) => rows.filter((row) => row.event_type === type);
  const attempts = byType("join_attempt");
  const joins = byType("join_success");
  const durations = (type: OperationalEventType) => byType(type).flatMap((row) => row.duration_ms === null ? [] : [Number(row.duration_ms)]);
  const failures = rows.filter((row) => !row.success).length;
  return {
    windowHours: 24,
    total: rows.length,
    errorRate: rows.length ? failures / rows.length : 0,
    joinSuccessRate: attempts.length ? joins.length / attempts.length : 0,
    joinP95Ms: percentile(durations("join_success"), 0.95),
    actionP95Ms: percentile(durations("game_action"), 0.95),
    reconnectP95Ms: percentile(durations("reconnect_success"), 0.95),
    gameStarts: byType("game_start").length,
    roundCompletes: byType("round_complete").length,
    reconnects: byType("reconnect_success").length,
    nextGames: byType("next_game").length,
    mediaUploads: byType("media_upload").length,
  };
}

export async function getEmailDeliverySummary() {
  if (!process.env.DATABASE_URL) return { sent: 0, delivered: 0, bounced: 0, complained: 0, failed: 0, latestAt: null };
  const [row] = await db()`SELECT
    COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
    COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered,
    COUNT(*) FILTER (WHERE status = 'bounced')::int AS bounced,
    COUNT(*) FILTER (WHERE status = 'complained')::int AS complained,
    COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
    MAX(updated_at) AS latest_at
    FROM auth_email_deliveries WHERE created_at >= NOW() - INTERVAL '24 hours'` as unknown as Array<Record<string, unknown>>;
  return {
    sent: Number(row?.sent ?? 0), delivered: Number(row?.delivered ?? 0), bounced: Number(row?.bounced ?? 0),
    complained: Number(row?.complained ?? 0), failed: Number(row?.failed ?? 0),
    latestAt: row?.latest_at ? new Date(row.latest_at as string | Date).toISOString() : null,
  };
}
