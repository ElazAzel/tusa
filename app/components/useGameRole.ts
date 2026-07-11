"use client";

export function useGameRole(participants: string[], userId: string | undefined): "stage" | "controller" {
  if (!userId || !participants.length) return "stage";
  return participants[0] === userId ? "stage" : "controller";
}
