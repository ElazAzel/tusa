"use client";

export type GameRole = "stage" | "controller" | "spectator";

export function useGameRole(participants: string[], userId: string | undefined, status: string = "lobby"): GameRole {
  if (!userId || !participants.length) return "stage";
  if (participants[0] === userId) return "stage";
  if (participants.includes(userId)) return "controller";
  return status === "active" ? "spectator" : "controller";
}
