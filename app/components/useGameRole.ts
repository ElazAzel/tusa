"use client";

export type GameRole = "stage" | "controller" | "spectator";

export function useGameRole(
  participants: string[],
  userId: string | undefined,
  status: string = "lobby",
  preferredRole?: "stage" | "controller" | null,
  creatorId?: string,
): GameRole {
  if (!userId || !participants.length) return "stage";
  const hostId = creatorId || participants[0];
  const isHost = hostId === userId;
  const isParticipant = participants.includes(userId);
  if (preferredRole === "stage" && isHost) return "stage";
  if (preferredRole === "controller" && (isParticipant || status !== "active")) return "controller";
  if (isHost) return "stage";
  if (isParticipant) return "controller";
  return status === "active" ? "spectator" : "controller";
}
