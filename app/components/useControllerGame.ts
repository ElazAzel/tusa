"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useControllerGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: T,
) {
  const [state, setState] = useState<T>(initialState);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) { setState(initialState); return; }

    fetch(`/api/games?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session?.state && Object.keys(data.session.state).length > 0) {
          setState((prev) => ({ ...prev, ...data.session.state }));
        }
      }).catch(() => undefined);

    let reconnectTimer: ReturnType<typeof setTimeout>;
    const connect = () => {
      const es = new EventSource(`/api/live?channel=${encodeURIComponent(`game:${sessionId}`)}`);
      esRef.current = es;
      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as { type: string; state?: Partial<T> };
          if (event.type === "state:updated" && event.state) {
            setState((prev) => ({ ...prev, ...event.state }));
          }
        } catch { /* ping */ }
      };
      es.onerror = () => {
        es.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => { clearTimeout(reconnectTimer); esRef.current?.close(); };
  }, [sessionId]);

  const sendAction = useCallback((actionType: string, payload?: unknown) => {
    if (!sessionId) return;
    fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "playerAction", sessionId, actionType, payload }),
    }).catch(() => undefined);
  }, [sessionId]);

  return { state, sendAction };
}
