"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useControllerGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: T,
) {
  const [state, setState] = useState<T>(initialState);
  const esRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    if (!sessionId) { setState(initialState); return; }

    const applySnapshot = (data: { session?: { state?: Partial<T>; participants?: string[] } }) => {
        const snap = data.session?.state;
        if (snap && Object.keys(snap).length > 0) {
          setState((prev) => {
            const merged = { ...prev, ...snap } as T;
            const participants = data.session?.participants ?? [];
            if (participants.length && Array.isArray(merged.players)) (merged as Record<string, unknown>).players = participants;
            return merged;
          });
        }
        setConnected(true);
    };
    fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json()).then(applySnapshot).catch(() => setConnected(false));
    const poll = setInterval(() => {
      fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json()).then(applySnapshot).catch(() => setConnected(false));
    }, 1500);

    let reconnectTimer: ReturnType<typeof setTimeout>;
    const connect = () => {
      const es = new EventSource(`/api/live?channel=${encodeURIComponent(`game:${sessionId}`)}`);
      esRef.current = es;
      es.onopen = () => setConnected(true);
      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as { type: string; state?: Partial<T> };
          if (event.type === "state:updated" && event.state) {
            setState((prev) => ({ ...prev, ...event.state }));
          }
        } catch { /* ping */ }
      };
      es.onerror = () => {
        setConnected(false);
        es.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => { clearInterval(poll); clearTimeout(reconnectTimer); esRef.current?.close(); };
  }, [sessionId]);

  const sendAction = useCallback((actionType: string, payload?: unknown) => {
    if (!sessionId) return;
    fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "playerAction", sessionId, actionType, payload }),
    }).catch(() => undefined);
  }, [sessionId]);

  return { state, sendAction, connected };
}
