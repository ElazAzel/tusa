"use client";

import Werewolf from "@/app/components/games/Werewolf";

/**
 * Mafia and Werewolf share the same server-authoritative social-deduction
 * loop: private roles on each controller, night actions, discussion, voting
 * and reveal. Keeping one engine prevents Mafia from falling back to the old
 * pass-a-single-phone flow.
 */
export default function MafiaGame(props: {
  partyId: string;
  sessionId?: string | null;
  onSave: (score: number) => void;
  role?: "stage" | "controller";
}) {
  return <Werewolf {...props} />;
}
