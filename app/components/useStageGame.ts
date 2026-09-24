"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendGameCommand } from "./sendGameCommand";
import { useGameChannel } from "./useGameChannel";

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
  const initialStateRef = useRef(initialState);
  const versionRef = useRef<number>(1);
  const seenActionsRef = useRef<Set<string>>(new Set());

  const pushActions = useCallback((actions: PlayerAction[]) => {
    const fresh = actions.filter((action) => !action.id || !seenActionsRef.current.has(action.id));
    fresh.forEach((action) => { if (action.id) seenActionsRef.current.add(action.id); });
    if (fresh.length) setPlayerActions((prev) => [...prev, ...fresh]);
  }, []);

  const applySnapshot = useCallback((data: { viewerId?: string; session?: { state?: Partial<T>; version?: number; participants?: string[] }; actions?: PlayerAction[] }) => {
    const snap = data.session?.state;
    const snapshotVersion = data.session?.version ?? 0;
    if (snap && Object.keys(snap).length > 0 && (!snapshotVersion || snapshotVersion >= versionRef.current)) {
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
    pushActions([...syntheticJoins, ...(data.actions ?? [])]);
  }, [pushActions]);

  const syncSnapshot = useCallback(() => {
    if (!sessionId) return;
    void fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json()).then(applySnapshot).catch(() => undefined);
  }, [sessionId, applySnapshot]);

  useEffect(() => {
    versionRef.current = 1;
    seenActionsRef.current = new Set();
    if (!sessionId) { _setState(initialStateRef.current); return; }
    syncSnapshot();
  }, [sessionId, syncSnapshot]);

  useGameChannel(sessionId, (event) => {
    if (event.type === "state:updated" && (!event.version || event.version > versionRef.current)) syncSnapshot();
    if (event.type === "session:started" || event.type === "player:joined" || event.type === "player:left") syncSnapshot();
    if (event.type === "player:action" && event.userId && event.actionType) pushActions([{ id: event.id, userId: event.userId, actionType: event.actionType, payload: event.payload }]);
  }, syncSnapshot);

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
    void sendGameCommand(sessionId, actionType, payload)
      .then((data) => { if (data && "session" in data && data.session) applySnapshot({ session: data.session as { state?: Partial<T>; version?: number; participants?: string[] } }); })
      .catch(() => undefined);
  }, [sessionId, applySnapshot]);

  return { state, setState, playerActions, clearActions, complete, sendAction };
}
