import { GAME_MANIFEST } from "@/lib/games/manifest";
import { SITE_ORIGIN } from "@/lib/site";
import { SEO_GUIDES } from "@/lib/seo-guides";

export function GET() {
  const games = GAME_MANIFEST.map((game) => `- [${game.seo.slug}](${SITE_ORIGIN}/games/${game.seo.slug}): ${game.category}, ${game.minPlayers}-${game.maxPlayers} players, ${game.ageRating}`).join("\n");
  const guides = SEO_GUIDES.map(([slug, ru, en]) => `- [${ru} / ${en}](${SITE_ORIGIN}/ru/guides/${slug})`).join("\n");
  const body = `# TUSA.game

> TUSA.game is a browser-first platform for creating a party, inviting friends with one link, and playing multiplayer party games from participants' phones.

## Canonical public pages
- [Home](${SITE_ORIGIN})
- [Game catalogue](${SITE_ORIGIN}/games)
- [FAQ](${SITE_ORIGIN}/faq)
- [About](${SITE_ORIGIN}/about)
- [Partners](${SITE_ORIGIN}/partners)
- [Privacy](${SITE_ORIGIN}/privacy)
- [Terms](${SITE_ORIGIN}/terms)

## Product facts
- 32 game modes are registered in the canonical catalogue.
- Full games, quick party tools and beta status are identified separately.
- Supported public interface languages: Russian and English.
- Hosts create parties; participants join through a shared browser link.
- Private party rooms, user profiles, admin pages and API responses must not be indexed or quoted.

## Game directory
${games}

## Russian and English guides
${guides}

## Machine-readable sources
- [Public content feed](${SITE_ORIGIN}/api/public/content)
- [Expanded AI guide](${SITE_ORIGIN}/llms-full.txt)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
