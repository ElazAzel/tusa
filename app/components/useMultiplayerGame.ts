"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useMultiplayerGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: () => T,
) {
  const [state, _setState] = useState<T>(initialState);
  const esRef = useRef<EventSource | null>(null);
  const initialStateRef = useRef(initialState);
  const versionRef = useRef<number>(1);

  useEffect(() => {
    if (!sessionId) { _setState(initialStateRef.current); return; }

    const applySnapshot = (data: { session?: { state?: Partial<T>; version?: number } }) => {
        const snap = data.session?.state;
        if (snap && Object.keys(snap).length > 0) {
          if (data.session?.version) versionRef.current = data.session.version;
          _setState((prev) => ({ ...prev, ...snap }));
        }
    };
    let disposed = false;
    let attempts = 0;
    const syncSnapshot = () => fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json()).then(applySnapshot).catch(() => undefined);
    void syncSnapshot();

    let reconnectTimer: ReturnType<typeof setTimeout>;
    const connect = () => {
      if (disposed) return;
      const es = new EventSource(`/api/live?channel=${encodeURIComponent(`game:${sessionId}`)}`);
      esRef.current = es;
      es.onopen = () => { attempts = 0; void syncSnapshot(); };
      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as { type: string; state?: Partial<T>; version?: number };
          if (event.type === "state:updated" && (!event.version || event.version > versionRef.current)) {
            void syncSnapshot();
          }
        } catch { /* ping */ }
      };
      es.onerror = () => {
        es.close();
        attempts += 1;
        const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempts, 5)) + Math.floor(Math.random() * 500);
        reconnectTimer = setTimeout(connect, delay);
      };
    };
    connect();
    return () => { disposed = true; clearTimeout(reconnectTimer); esRef.current?.close(); };
  }, [sessionId]);

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    _setState((prev) => {
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
      return next;
    });
  }, []);

  const complete = useCallback(() => {
    if (!sessionId) return;
    fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", sessionId }) }).catch(() => undefined);
  }, [sessionId]);

  return { state, setState, isMultiplayer: Boolean(sessionId), complete };
}
