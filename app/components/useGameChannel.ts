"use client";

import { useEffect, useRef } from "react";
import { useLiveStream } from "./useLiveStream";

export type GameChannelEvent = {
  type: string;
  id?: string;
  version?: number;
  userId?: string;
  actionType?: string;
  payload?: unknown;
};

const MAX_BUFFERED_EVENTS = 200;

export function useGameChannel(sessionId: string | null, onEvent: (event: GameChannelEvent) => void, onResync: () => void) {
  const live = useLiveStream<GameChannelEvent>(sessionId ? `game:${sessionId}` : null);
  const processedRef = useRef(0);
  const onEventRef = useRef(onEvent);
  const onResyncRef = useRef(onResync);

  useEffect(() => {
    onEventRef.current = onEvent;
    onResyncRef.current = onResync;
  });

  const { events, clear, connectionEpoch, connected, hasConnectedOnce } = live;

  useEffect(() => {
    if (events.length < processedRef.current) processedRef.current = 0;
    const fresh = events.slice(processedRef.current);
    processedRef.current = events.length;
    fresh.forEach((event) => onEventRef.current(event));
    if (events.length > MAX_BUFFERED_EVENTS) clear();
  }, [events, clear]);

  useEffect(() => {
    if (connectionEpoch > 0) onResyncRef.current();
  }, [connectionEpoch]);

  useEffect(() => {
    if (!sessionId) return;
    const wake = () => { if (document.visibilityState === "visible") onResyncRef.current(); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    return () => {
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [sessionId]);

  return { connected: connected || !hasConnectedOnce };
}
