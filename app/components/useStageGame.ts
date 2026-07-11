"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PlayerAction = {
  userId: string;
  actionType: string;
  payload: unknown;
};

export function useStageGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: () => T,
) {
  const [state, _setState] = useState<T>(initialState);
  const [playerActions, setPlayerActions] = useState<PlayerAction[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) { _setState(initialState); return; }
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(`game:${sessionId}`)}`);
    esRef.current = es;
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as { type: string; state?: Partial<T>; userId?: string; actionType?: string; payload?: unknown };
        if (event.type === "state:updated" && event.state) {
          _setState((prev) => ({ ...prev, ...event.state }));
        }
        if (event.type === "player:action" && event.userId && event.actionType) {
          setPlayerActions((prev) => [...prev, { userId: event.userId!, actionType: event.actionType!, payload: event.payload }]);
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

  const clearActions = useCallback(() => setPlayerActions([]), []);

  const complete = useCallback(() => {
    if (!sessionId) return;
    fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", sessionId }),
    }).catch(() => undefined);
  }, [sessionId]);

  return { state, setState, playerActions, clearActions, complete };
}
