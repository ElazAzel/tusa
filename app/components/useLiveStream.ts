"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLiveStream<T = unknown>(channel: string | null) {
  const [events, setEvents] = useState<T[]>([]);
  const listenerRef = useRef<((event: T) => void) | undefined>(undefined);

  const addEvent = useCallback((event: T) => {
    setEvents((prev) => [...prev, event]);
    listenerRef.current?.(event);
  }, []);

  useEffect(() => {
    if (!channel) return;
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(channel)}`);
    es.onmessage = (msg) => {
      try { addEvent(JSON.parse(msg.data) as T); } catch { /* ignore pings */ }
    };
    es.onerror = () => { es.close(); };
    return () => es.close();
  }, [channel, addEvent]);

  const onEvent = useCallback((handler: (event: T) => void) => { listenerRef.current = handler; }, []);

  return { events, onEvent, clear: useCallback(() => setEvents([]), []) };
}
