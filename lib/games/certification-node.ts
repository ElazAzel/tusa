import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getGameById } from "./manifest";

export const certificationScenarios = ["create_join_start", "full_round", "reconnect", "rematch", "privacy", "moderation", "spectator_leave", "ru", "en", "mobile"] as const;
export const certificationGameIds = ["impostor", "alias", "trivia", "bombParty", "quiplash", "fibbage", "wouldRather", "twoTruths"] as const;

export function certificationParticipantCount(gameId: (typeof certificationGameIds)[number]) {
  return Math.max(3, getGameById(gameId)?.minPlayers ?? 3);
}

const sources: Record<(typeof certificationGameIds)[number], [string, string]> = {
  impostor: ["lib/games/definitions/impostor.ts", "app/components/games/Impostor.tsx"],
  alias: ["lib/games/definitions/word-blast.ts", "app/components/games/AliasGame.tsx"],
  trivia: ["lib/games/definitions/trivia.ts", "app/components/games/Trivia.tsx"],
  bombParty: ["lib/games/definitions/bomb-party.ts", "app/components/games/BombParty.tsx"],
  quiplash: ["lib/games/definitions/punchline.ts", "app/components/games/Quiplash.tsx"],
  fibbage: ["lib/games/definitions/fake-fact.ts", "app/components/games/Fibbage.tsx"],
  wouldRather: ["lib/games/definitions/would-rather.ts", "app/components/games/WouldYouRather.tsx"],
  twoTruths: ["lib/games/definitions/two-truths.ts", "app/components/games/TwoTruths.tsx"],
};

export function computeCertificationSourceHash(gameId: (typeof certificationGameIds)[number], cwd = process.cwd()) {
  const files = ["lib/games/manifest.ts", "lib/games/commands.ts", "lib/games/sdk.ts", "app/api/games/route.ts", ...sources[gameId]];
  const hash = createHash("sha256");
  for (const file of files) hash.update(file).update("\0").update(readFileSync(resolve(cwd, file)));
  return hash.digest("hex");
}
