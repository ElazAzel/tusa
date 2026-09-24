"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { botDisplayName, isBotId } from "@/lib/games/bot-names";

const PlayerNamesContext = createContext<Record<string, string>>({});

export function PlayerNamesProvider({ names, children }: { names: Record<string, string>; children: ReactNode }) {
  return <PlayerNamesContext.Provider value={names}>{children}</PlayerNamesContext.Provider>;
}

export function usePlayerName() {
  const names = useContext(PlayerNamesContext);
  return useCallback((id: string | null | undefined) => {
    if (!id) return "";
    if (isBotId(id)) return botDisplayName(id);
    return names[id] || id.slice(-6);
  }, [names]);
}
