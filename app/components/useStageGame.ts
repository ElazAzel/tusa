"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendGameCommand } from "./sendGameCommand";

export type PlayerAction = {
  id?: string;
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
  const initialStateRef = useRef(initialState);
  const versionRef = useRef<number>(1);
  const seenActionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionId) { _setState(initialStateRef.current); return; }

    const applySnapshot = (data: { viewerId?: string; session?: { state?: Partial<T>; version?: number; participants?: string[] }; actions?: PlayerAction[] }) => {
        const snap = data.session?.state;
        if (snap && Object.keys(snap).length > 0) {
          const snapshotVersion = data.session?.version;
          if (snapshotVersion) versionRef.current = snapshotVersion;
          _setState((prev) => {
            const merged = { ...prev, ...snap } as T;
            if (data.viewerId) (merged as Record<string, unknown>).viewerId = data.viewerId;
            const participants = data.session?.participants ?? [];
            if (participants.length && Array.isArray(merged.players)) {
              const currentPlayers = merged.players as unknown[];
              if (!currentPlayers.length || currentPlayers.every((player) => typeof player === "string" && /^Player \d+$/.test(player))) (merged as Record<string, unknown>).players = participants;
            }
            return merged;
          });
        }
        const syntheticJoins: PlayerAction[] = (data.session?.participants ?? []).map((userId) => ({ id: `join:${userId}`, userId, actionType: "join", payload: {} }));
        const fresh = [...syntheticJoins, ...(data.actions ?? [])].filter((action) => !action.id || !seenActionsRef.current.has(action.id));
        fresh.forEach((action) => { if (action.id) seenActionsRef.current.add(action.id); });
        if (fresh.length) setPlayerActions((prev) => [...prev, ...fresh]);
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
          const event = JSON.parse(msg.data) as { type: string; id?: string; state?: Partial<T>; version?: number; userId?: string; actionType?: string; payload?: unknown };
          if (event.type === "state:updated" && (!event.version || event.version > versionRef.current)) {
            void syncSnapshot();
          }
          if (event.type === "player:action" && event.userId && event.actionType) {
            if (event.id && seenActionsRef.current.has(event.id)) return;
            if (event.id) seenActionsRef.current.add(event.id);
            setPlayerActions((prev) => [...prev, { id: event.id, userId: event.userId!, actionType: event.actionType!, payload: event.payload }]);
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
    const handleWakeup = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && !disposed) {
        void syncSnapshot();
        if (esRef.current?.readyState === EventSource.CLOSED) {
          clearTimeout(reconnectTimer);
          connect();
        }
      }
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", handleWakeup);
    if (typeof window !== "undefined") window.addEventListener("online", handleWakeup);

    connect();
    return () => {
      disposed = true;
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", handleWakeup);
      if (typeof window !== "undefined") window.removeEventListener("online", handleWakeup);
      clearTimeout(reconnectTimer);
      esRef.current?.close();
    };
  }, [sessionId]);

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    _setState((prev) => {
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
      return next;
    });
  }, []);

  const clearActions = useCallback(() => setPlayerActions([]), []);

  const complete = useCallback(() => {
    if (!sessionId) return;
    fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", sessionId }),
    }).catch(() => undefined);
  }, [sessionId]);

  const sendAction = useCallback((actionType: string, payload?: unknown) => {
    if (!sessionId) return;
    void sendGameCommand(sessionId, actionType, payload).catch(() => undefined);
  }, [sessionId]);

  return { state, setState, playerActions, clearActions, complete, sendAction };
}
