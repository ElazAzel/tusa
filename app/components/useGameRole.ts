"use client";

export type GameRole = "stage" | "controller" | "spectator";

export function useGameRole(
  participants: string[],
  userId: string | undefined,
  status: string = "lobby",
  preferredRole?: "stage" | "controller" | null,
): GameRole {
  if (preferredRole) {
    if (status === "active" && userId && !participants.includes(userId) && preferredRole === "controller") {
      return "spectator";
    }
    return preferredRole;
  }
  if (!userId) return "stage";
  const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || ("ontouchstart" in window));
  if (isMobile) return "controller";
  if (participants[0] === userId) return "stage";
  if (participants.includes(userId)) return "controller";
  return status === "active" ? "spectator" : "stage";
}
