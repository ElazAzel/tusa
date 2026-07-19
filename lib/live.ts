import { randomUUID } from "node:crypto";
import * as Ably from "ably";
import { neon } from "@neondatabase/serverless";
import { hasAblyConfiguration, hasDatabaseTransport, realtimeTransportAvailable } from "@/lib/runtime-status";

type Listener = (data: unknown) => void;
const localChannels = new Map<string, Set<Listener>>();
let restClient: Ably.Rest | null = null;
let eventDatabase: ReturnType<typeof neon> | null = null;

function getAblyKey() { return hasAblyConfiguration() ? process.env.ABLY_API_KEY!.trim() : null; }
function getEventDatabase() {
  if (!hasDatabaseTransport()) return null;
  if (!eventDatabase) eventDatabase = neon(process.env.DATABASE_URL!);
  return eventDatabase;
}

export function isRealtimeTransportAvailable() {
  return realtimeTransportAvailable();
}

function getRestClient() {
  const key = getAblyKey();
  if (!key) return null;
  if (!restClient) restClient = new Ably.Rest({ key, echoMessages: false });
  return restClient;
}

export async function createRealtimeTokenRequest(clientId: string, channel: string) {
  const ably = getRestClient();
  if (!ably) throw new Error("Realtime provider is not configured");
  return ably.auth.createTokenRequest({
    clientId,
    capability: JSON.stringify({ [channel]: ["subscribe", "presence"] }),
    ttl: 60 * 60 * 1000,
  });
}

function subscribeLocal(channel: string, listener: Listener) {
  if (!localChannels.has(channel)) localChannels.set(channel, new Set());
  localChannels.get(channel)!.add(listener);
  return () => {
    const listeners = localChannels.get(channel);
    listeners?.delete(listener);
    if (listeners?.size === 0) localChannels.delete(channel);
  };
}

function eventEnvelope(channel: string, data: unknown) {
  const base = data && typeof data === "object" ? data as Record<string, unknown> : { data };
  return { eventId: randomUUID(), occurredAt: new Date().toISOString(), channel, ...base };
}

const MAX_PAYLOAD_BYTES = 64_000;

export function publish(channel: string, data: unknown) {
  const event = eventEnvelope(channel, data);
  const serialized = JSON.stringify(event);
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    console.error("[realtime] payload too large", { channel, bytes: serialized.length });
    return;
  }
  const ably = getRestClient();
  if (ably) {
    void ably.channels.get(channel).publish("tusa:event", event).catch((error) => {
      console.error("[realtime] Ably publish failed", { channel, error: error instanceof Error ? error.message : String(error) });
    });
    return;
  }
  const sql = getEventDatabase();
  if (sql) {
    void sql`INSERT INTO live_events (id, channel, payload) VALUES (${String(event.eventId)}::uuid, ${channel}, ${JSON.stringify(event)}::jsonb)`.catch((error) => {
      console.error("[realtime] database publish failed", { channel, error: error instanceof Error ? error.message : String(error) });
    });
    return;
  }
  const listeners = localChannels.get(channel);
  if (listeners) for (const listener of listeners) listener(event);
}

export function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

let eventCounter = 0;

export async function* generateEvents(channelName: string, lastEventId?: string) {
  const queue: unknown[] = [];
  let wake: (() => void) | null = null;
  const listener: Listener = (data) => { queue.push(data); wake?.(); wake = null; };
  const key = getAblyKey();
  let unsubscribe: () => void = () => {};
  let realtime: Ably.Realtime | null = null;
  const eventSql = getEventDatabase();

  if (key) {
    realtime = new Ably.Realtime({ key, clientId: `tusa-sse-${randomUUID()}`, echoMessages: false });
    const channel = realtime.channels.get(channelName);
    const messageListener = (message: Ably.InboundMessage) => listener(message.data);
    await channel.subscribe("tusa:event", messageListener);
    unsubscribe = () => channel.unsubscribe("tusa:event", messageListener);
  } else if (!eventSql) {
    unsubscribe = subscribeLocal(channelName, listener);
  }

  if (!key && eventSql) {
    let cursor = new Date(Date.now() - 2_000).toISOString();
    const seen = new Set<string>(lastEventId ? [lastEventId] : []);
    let idleTicks = 0;
    while (true) {
      const rows = await eventSql`SELECT id, payload, created_at FROM live_events
        WHERE channel = ${channelName} AND created_at >= ${cursor}::timestamptz
        ORDER BY created_at ASC, id ASC LIMIT 200` as unknown as Array<{ id: string; payload: unknown; created_at: string | Date }>;
      let emitted = false;
      for (const row of rows) {
        cursor = new Date(row.created_at).toISOString();
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        emitted = true;
        yield `id: ${row.id}\ndata: ${JSON.stringify(row.payload)}\n\n`;
      }
      if (seen.size > 500) seen.clear();
      idleTicks = emitted ? 0 : idleTicks + 1;
      if (idleTicks >= 15) { idleTicks = 0; yield `: ping\n\n`; }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }

  void lastEventId;

  try {
    while (true) {
      if (queue.length === 0) {
        const notified = new Promise<void>((resolve) => { wake = resolve; });
        await Promise.race([notified, new Promise((resolve) => setTimeout(resolve, 15_000))]);
      }
      if (queue.length === 0) {
        yield `: ping\n\n`;
        continue;
      }
      while (queue.length > 0) {
        eventCounter++;
        yield `id: ${eventCounter}\ndata: ${JSON.stringify(queue.shift())}\n\n`;
      }
    }
  } finally {
    unsubscribe();
    realtime?.close();
  }
}
