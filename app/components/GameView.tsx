"use client";

import { createContext, useContext, type ReactNode } from "react";

const PublicStageContext = createContext(false);

export function PublicStageProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <PublicStageContext.Provider value={value}>{children}</PublicStageContext.Provider>;
}

export function usePublicStage() {
  return useContext(PublicStageContext);
}
