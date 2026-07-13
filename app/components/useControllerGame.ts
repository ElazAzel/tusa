"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendGameCommand } from "./sendGameCommand";

export function useControllerGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: T,
) {
  const [state, setState] = useState<T>(initialState);
  const esRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(true);
  const versionRef = useRef(0);

  useEffect(() => {
    if (!sessionId) { setState(initialState); return; }

    let disposed = false;
    let attempts = 0;
    const applySnapshot = (data: { viewerId?: string; session?: { state?: Partial<T>; participants?: string[]; version?: number } }) => {
        const snap = data.session?.state;
        if (snap && Object.keys(snap).length > 0) {
          if (data.session?.version) versionRef.current = data.session.version;
          setState((prev) => {
            const merged = { ...prev, ...snap } as T;
            if (data.viewerId) (merged as Record<string, unknown>).viewerId = data.viewerId;
            const participants = data.session?.participants ?? [];
            if (participants.length && Array.isArray(merged.players)) (merged as Record<string, unknown>).players = participants;
            return merged;
          });
        }
        setConnected(true);
    };
    const syncSnapshot = () => fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json()).then(applySnapshot).catch(() => setConnected(false));
    void syncSnapshot();

    let reconnectTimer: ReturnType<typeof setTimeout>;
    const connect = () => {
      if (disposed) return;
      const es = new EventSource(`/api/live?channel=${encodeURIComponent(`game:${sessionId}`)}`);
      esRef.current = es;
      es.onopen = () => { attempts = 0; setConnected(true); void syncSnapshot(); };
      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as { type: string; state?: Partial<T>; version?: number };
          if (event.type === "state:updated" && event.state) {
            if (event.version) versionRef.current = event.version;
            setState((prev) => ({ ...prev, ...event.state }));
          } else if (event.type === "state:updated" && (!event.version || event.version > versionRef.current)) {
            void syncSnapshot();
          }
        } catch { /* ping */ }
      };
      es.onerror = () => {
        setConnected(false);
        es.close();
        attempts += 1;
        const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempts, 5)) + Math.floor(Math.random() * 500);
        reconnectTimer = setTimeout(connect, delay);
      };
    };
    connect();
    return () => { disposed = true; clearTimeout(reconnectTimer); esRef.current?.close(); };
  }, [sessionId]);

  const sendAction = useCallback((actionType: string, payload?: unknown) => {
    if (!sessionId) return;
    void sendGameCommand(sessionId, actionType, payload).catch(() => undefined);
  }, [sessionId]);

  return { state, sendAction, connected };
}
