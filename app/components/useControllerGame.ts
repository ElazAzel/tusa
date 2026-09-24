"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendGameCommand } from "./sendGameCommand";
import { useGameChannel } from "./useGameChannel";

type Snapshot<T> = { viewerId?: string; session?: { state?: Partial<T>; participants?: string[]; version?: number } };

export function useControllerGame<T extends Record<string, unknown>>(
  sessionId: string | null,
  initialState: T,
) {
  const [state, setState] = useState<T>(initialState);
  const initialStateRef = useRef(initialState);
  const [snapshotOk, setSnapshotOk] = useState(true);
  const versionRef = useRef(0);
  const viewerIdRef = useRef<string | undefined>(undefined);

  const applySnapshot = useCallback((data: Snapshot<T>) => {
    const snap = data.session?.state;
    const version = data.session?.version ?? 0;
    if (data.viewerId) viewerIdRef.current = data.viewerId;
    if (snap && Object.keys(snap).length > 0 && (!version || version >= versionRef.current)) {
      if (version) versionRef.current = version;
      setState((prev) => {
        const merged = { ...prev, ...snap } as T;
        if (viewerIdRef.current) (merged as Record<string, unknown>).viewerId = viewerIdRef.current;
        const participants = data.session?.participants ?? [];
        if (participants.length && Array.isArray(merged.players)) (merged as Record<string, unknown>).players = participants;
        return merged;
      });
    }
    setSnapshotOk(true);
  }, []);

  const syncSnapshot = useCallback(() => {
    if (!sessionId) return;
    void fetch(`/api/games?sessionId=${sessionId}`).then((r) => r.json()).then(applySnapshot).catch(() => setSnapshotOk(false));
  }, [sessionId, applySnapshot]);

  useEffect(() => {
    versionRef.current = 0;
    if (!sessionId) { setState(initialStateRef.current); return; }
    syncSnapshot();
  }, [sessionId, syncSnapshot]);

  const live = useGameChannel(sessionId, (event) => {
    if (event.type === "state:updated" && (!event.version || event.version > versionRef.current)) syncSnapshot();
    if (event.type === "session:started" || event.type === "session:completed") syncSnapshot();
  }, syncSnapshot);

  const sendAction = useCallback((actionType: string, payload?: unknown) => {
    if (!sessionId) return;
    void sendGameCommand(sessionId, actionType, payload)
      .then((data) => { if (data && "session" in data && data.session) applySnapshot({ session: data.session as Snapshot<T>["session"] }); })
      .catch(() => undefined);
  }, [sessionId, applySnapshot]);

  return { state, sendAction, connected: live.connected && snapshotOk };
}
