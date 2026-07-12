"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useMultiplayerGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: () => T,
) {
  const [state, _setState] = useState<T>(initialState);
  const esRef = useRef<EventSource | null>(null);
  const stateRef = useRef<T>(state);
  const versionRef = useRef<number>(1);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  stateRef.current = state;

  useEffect(() => {
    if (!sessionId) { _setState(initialState); return; }

    const applySnapshot = (data: { session?: { state?: Partial<T>; version?: number } }) => {
        const snap = data.session?.state;
        if (snap && Object.keys(snap).length > 0) {
          if (data.session?.version) versionRef.current = data.session.version;
          _setState((prev) => ({ ...prev, ...snap }));
        }
    };
    fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json()).then(applySnapshot).catch(() => undefined);
    const poll = setInterval(() => fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json()).then(applySnapshot).catch(() => undefined), 1500);

    let reconnectTimer: ReturnType<typeof setTimeout>;
    const connect = () => {
      const es = new EventSource(`/api/live?channel=${encodeURIComponent(`game:${sessionId}`)}`);
      esRef.current = es;
      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as { type: string; state?: Partial<T>; version?: number };
          if (event.type === "state:updated" && event.state) {
            if (event.version) versionRef.current = event.version;
            _setState((prev) => ({ ...prev, ...event.state }));
          }
        } catch { /* ping */ }
      };
      es.onerror = () => {
        es.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => { clearInterval(poll); clearTimeout(reconnectTimer); esRef.current?.close(); };
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
