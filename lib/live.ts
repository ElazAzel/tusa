import { randomUUID } from "node:crypto";
import * as Ably from "ably";

type Listener = (data: unknown) => void;
const localChannels = new Map<string, Set<Listener>>();
let restClient: Ably.Rest | null = null;

function getAblyKey() { return process.env.ABLY_API_KEY?.trim() || null; }

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

export function publish(channel: string, data: unknown) {
  const event = eventEnvelope(channel, data);
  const ably = getRestClient();
  if (ably) {
    void ably.channels.get(channel).publish("tusa:event", event).catch((error) => {
      console.error("[realtime] Ably publish failed", { channel, error: error instanceof Error ? error.message : String(error) });
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

export async function* generateEvents(channelName: string) {
  const queue: unknown[] = [];
  let wake: (() => void) | null = null;
  const listener: Listener = (data) => { queue.push(data); wake?.(); wake = null; };
  const key = getAblyKey();
  let unsubscribe: () => void = () => {};
  let realtime: Ably.Realtime | null = null;

  if (key) {
    realtime = new Ably.Realtime({ key, clientId: `tusa-sse-${randomUUID()}`, echoMessages: false });
    const channel = realtime.channels.get(channelName);
    const messageListener = (message: Ably.InboundMessage) => listener(message.data);
    await channel.subscribe("tusa:event", messageListener);
    unsubscribe = () => channel.unsubscribe("tusa:event", messageListener);
  } else {
    unsubscribe = subscribeLocal(channelName, listener);
  }

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
      while (queue.length > 0) yield `data: ${JSON.stringify(queue.shift())}\n\n`;
    }
  } finally {
    unsubscribe();
    realtime?.close();
  }
}
