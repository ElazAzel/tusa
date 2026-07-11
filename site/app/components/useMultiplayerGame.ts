"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useMultiplayerGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: () => T,
) {
  const [state, _setState] = useState<T>(initialState);
  const esRef = useRef<EventSource | null>(null);
  const stateRef = useRef<T>(state);
  stateRef.current = state;

  useEffect(() => {
    if (!sessionId) { _setState(initialState); return; }
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(`game:${sessionId}`)}`);
    esRef.current = es;
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as { type: string; state?: Partial<T> };
        if (event.type === "state:updated" && event.state) {
          _setState((prev) => ({ ...prev, ...event.state }));
        }
      } catch { /* ping */ }
    };
    es.onerror = () => es.close();
    return () => { es.close(); };
  }, [sessionId]);

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    _setState((prev) => {
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
      if (sessionId) {
        fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", sessionId, state: next }),
        }).catch(() => undefined);
      }
      return next;
    });
  }, [sessionId]);

  return { state, setState, isMultiplayer: Boolean(sessionId) };
}
