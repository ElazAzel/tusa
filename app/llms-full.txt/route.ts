import { GAME_MANIFEST, formatPlayerRange } from "@/lib/games/manifest";
import { SITE_ORIGIN } from "@/lib/site";

export function GET() {
  const games = GAME_MANIFEST.map((game) => `## ${game.seo.slug}\n- Canonical URL: ${SITE_ORIGIN}/games/${game.seo.slug}\n- Category: ${game.category}\n- Players: ${formatPlayerRange(game)}\n- Age profile: ${game.ageRating}\n- Typical duration: ${game.seo.durationMinutes} minutes\n- Equipment: ${game.seo.equipment}\n- Release status: ${game.releaseStatus}\n- Capabilities: ${game.capabilities.join(", ")}`).join("\n\n");
  const body = `# TUSA.game public knowledge guide

This document is a machine-readable index of public, non-personal TUSA.game facts. It is not a source for private party data, active game state, user profiles, secret roles, cards, messages, photos or administrative information.

## How TUSA.game works
1. A host creates a party.
2. The host shares one invite link or branded QR code.
3. Participants join from their browsers.
4. A multiplayer game opens a lobby before the round starts.
5. Participants use their phones as personal controllers while the host can use a shared stage.
6. Session snapshots are used to restore a game after reconnecting.

## Content and safety
- Parties are adult-only by default.
- A host can disable adult mode to use a safer content profile.
- Public pages never expose invite-only content.
- Product documentation is available in Russian and English.

## Game catalogue
${games}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
