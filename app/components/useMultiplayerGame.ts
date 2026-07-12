"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useMultiplayerGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: () => T,
) {
  const [state, _setState] = useState<T>(initialState);
  const esRef = useRef<EventSource | null>(null);
  const versionRef = useRef<number>(1);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!sessionId) { _setState(initialState); return; }

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
          if (event.type === "state:updated" && event.state) {
            if (event.version) versionRef.current = event.version;
            _setState((prev) => ({ ...prev, ...event.state }));
          } else if (event.type === "state:updated" && (!event.version || event.version > versionRef.current)) {
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
      if (sessionId) {
        syncQueueRef.current = syncQueueRef.current.then(async () => {
          const ver = versionRef.current;
          const response = await fetch("/api/games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update", sessionId, state: next, version: ver }),
          });
          const data = await response.json().catch(() => ({}));
          if (response.ok && data.session?.version) versionRef.current = data.session.version;
          if (response.status === 409) {
            const fresh = await fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json());
            if (fresh.session?.version) versionRef.current = fresh.session.version;
            if (fresh.session?.state) _setState((current) => ({ ...current, ...fresh.session.state }));
          }
        }).catch(() => undefined);
      }
      return next;
    });
  }, [sessionId]);

  return { state, setState, isMultiplayer: Boolean(sessionId) };
}
