"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLiveStream<T = unknown>(channel: string | null) {
  const [events, setEvents] = useState<T[]>([]);
  const [connected, setConnected] = useState(false);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [connectionEpoch, setConnectionEpoch] = useState(0);
  const listenerRef = useRef<((event: T) => void) | undefined>(undefined);

  const addEvent = useCallback((event: T) => {
    setEvents((prev) => [...prev, event]);
    listenerRef.current?.(event);
  }, []);

  useEffect(() => {
    if (!channel) return;
    let disposed = false;
    let attempts = 0;
    let reconnectStartedAt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let es: EventSource | null = null;
    const connect = () => {
      if (disposed) return;
      es = new EventSource(`/api/live?channel=${encodeURIComponent(channel)}`);
      es.onopen = () => {
        if (attempts > 0 && reconnectStartedAt > 0) {
          void fetch("/api/telemetry/operations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventType: "reconnect_success", durationMs: Math.round(performance.now() - reconnectStartedAt), dimensions: { channel: channel.split(":")[0] } }), keepalive: true }).catch(() => undefined);
        }
        attempts = 0;
        reconnectStartedAt = 0;
        setConnected(true);
        setHasConnectedOnce(true);
        setConnectionEpoch((value) => value + 1);
      };
      es.onmessage = (msg) => {
        try { addEvent(JSON.parse(msg.data) as T); } catch { /* ignore pings */ }
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        if (attempts === 0) reconnectStartedAt = performance.now();
        attempts += 1;
        const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempts, 5)) + Math.floor(Math.random() * 500);
        reconnectTimer = setTimeout(connect, delay);
      };
    };
    connect();
    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      es?.close();
      setConnected(false);
    };
  }, [channel, addEvent]);

  const onEvent = useCallback((handler: (event: T) => void) => { listenerRef.current = handler; }, []);

  return { events, connected, hasConnectedOnce, connectionEpoch, onEvent, clear: useCallback(() => setEvents([]), []) };
}
