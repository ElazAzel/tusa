"use client";

import * as Ably from "ably";
import { useCallback, useEffect, useRef, useState } from "react";

export type LiveTransport = "ably" | "sse" | "offline";

export function useLiveStream<T = unknown>(channel: string | null) {
  const [events, setEvents] = useState<T[]>([]);
  const [connected, setConnected] = useState(false);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [connectionEpoch, setConnectionEpoch] = useState(0);
  const [transport, setTransport] = useState<LiveTransport>("offline");
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
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let handoffTimer: ReturnType<typeof setTimeout> | undefined;
    let eventSource: EventSource | null = null;
    let realtime: Ably.Realtime | null = null;
    let usingSse = false;

    const reportReconnect = () => {
      if (attempts === 0 || reconnectStartedAt === 0) return;
      void fetch("/api/telemetry/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "reconnect_success", durationMs: Math.round(performance.now() - reconnectStartedAt), dimensions: { channel: channel.split(":")[0] } }),
        keepalive: true,
      }).catch(() => undefined);
    };

    const markConnected = (nextTransport: Exclude<LiveTransport, "offline">) => {
      if (disposed) return;
      reportReconnect();
      attempts = 0;
      reconnectStartedAt = 0;
      clearTimeout(handoffTimer);
      setConnected(true);
      setHasConnectedOnce(true);
      setTransport(nextTransport);
      setConnectionEpoch((value) => value + 1);
    };

    const scheduleSseReconnect = () => {
      if (disposed) return;
      if (attempts === 0) reconnectStartedAt = performance.now();
      attempts += 1;
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempts, 5)) + Math.floor(Math.random() * 500);
      reconnectTimer = setTimeout(connectSse, delay);
    };

    const connectSse = () => {
      if (disposed) return;
      usingSse = true;
      realtime?.close();
      realtime = null;
      eventSource?.close();
      eventSource = new EventSource(`/api/live?channel=${encodeURIComponent(channel)}`);
      eventSource.onopen = () => markConnected("sse");
      eventSource.onmessage = (message) => {
        try { addEvent(JSON.parse(message.data) as T); } catch { }
      };
      eventSource.onerror = () => {
        if (disposed) return;
        setConnected(false);
        setTransport("offline");
        eventSource?.close();
        scheduleSseReconnect();
      };
    };

    const switchToSse = () => {
      if (disposed || usingSse) return;
      clearTimeout(handoffTimer);
      connectSse();
    };

    const connectAbly = () => {
      if (disposed) return;
      realtime = new Ably.Realtime({
        authCallback: async (_params, callback) => {
          try {
            const response = await fetch(`/api/realtime/token?channel=${encodeURIComponent(channel)}`, { cache: "no-store" });
            if (!response.ok) throw new Error(`Realtime token request failed (${response.status}).`);
            callback(null, await response.json() as Ably.TokenRequest);
          } catch (error) {
            callback(error instanceof Error ? error.message : "Realtime token request failed.", null);
          }
        },
      });
      const realtimeChannel = realtime.channels.get(channel);
      void realtimeChannel.subscribe("tusa:event", (message) => addEvent(message.data as T)).catch(switchToSse);
      realtime.connection.on("connected", () => {
        markConnected("ably");
        void realtimeChannel.presence.enter({ channel }).catch(() => undefined);
      });
      realtime.connection.on("disconnected", () => {
        if (disposed) return;
        setConnected(false);
        setTransport("offline");
      });
      realtime.connection.on("suspended", switchToSse);
      realtime.connection.on("failed", switchToSse);
      handoffTimer = setTimeout(switchToSse, 5_000);
    };

    const handleWakeup = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && !disposed) {
        clearTimeout(reconnectTimer);
        attempts = 0;
        connectSse();
      }
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", handleWakeup);
    if (typeof window !== "undefined") window.addEventListener("online", handleWakeup);

    connectAbly();
    return () => {
      disposed = true;
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", handleWakeup);
      if (typeof window !== "undefined") window.removeEventListener("online", handleWakeup);
      clearTimeout(reconnectTimer);
      clearTimeout(handoffTimer);
      eventSource?.close();
      realtime?.close();
      setConnected(false);
      setTransport("offline");
    };
  }, [channel, addEvent]);

  const onEvent = useCallback((handler: (event: T) => void) => { listenerRef.current = handler; }, []);

  return { events, connected, hasConnectedOnce, connectionEpoch, transport, onEvent, clear: useCallback(() => setEvents([]), []) };
}
