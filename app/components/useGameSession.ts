"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameSession } from "@/lib/parties";

type GameEvent = {
  type: string;
  sessionId?: string;
  userId?: string;
  state?: Record<string, unknown>;
  status?: string;
  participants?: string[];
  session?: GameSession;
  score?: unknown;
  scores?: unknown[];
};

export function useGameSession(sessionId: string | null) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [remoteState, setRemoteState] = useState<Record<string, unknown>>({});
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) { setSession(null); setParticipants([]); setRemoteState({}); return; }
    const es = new EventSource(`/api/live?channel=${encodeURIComponent(`game:${sessionId}`)}`);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as GameEvent;
        if (event.type === "session:created" && event.session) {
          setSession(event.session);
          setParticipants(event.session.participants ?? []);
        }
        if (event.type === "player:joined" || event.type === "player:left") {
          if (event.participants) setParticipants(event.participants);
        }
        if (event.type === "state:updated") {
          void fetch(`/api/games?sessionId=${sessionId}`).then((response) => response.json()).then((data: { session?: GameSession }) => {
            if (data.session) {
              setSession(data.session);
              setRemoteState(data.session.state ?? {});
              setParticipants(data.session.participants ?? []);
            }
          }).catch(() => undefined);
        }
        if (event.type === "session:completed") {
          setSession((prev) => prev ? { ...prev, status: "completed" } : prev);
        }
      } catch { /* ping */ }
    };
    es.onerror = () => { es.close(); setConnected(false); };
    return () => { es.close(); setConnected(false); };
  }, [sessionId]);

  const updateState = useCallback((state: Record<string, unknown>) => {
    if (!sessionId) return;
    setRemoteState((prev) => ({ ...prev, ...state }));
  }, [sessionId]);

  const setStatus = useCallback((status: string) => {
    if (!sessionId) return;
    fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", sessionId, status }),
    }).catch(() => undefined);
  }, [sessionId]);

  const complete = useCallback(() => {
    if (!sessionId) return;
    fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", sessionId }),
    }).catch(() => undefined);
  }, [sessionId]);

  return { session, participants, remoteState, connected, updateState, setStatus, complete };
}
