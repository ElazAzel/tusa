import { NextResponse } from "next/server";
import { GAME_MANIFEST, formatPlayerRange } from "@/lib/games/manifest";
import { CONTENT_UPDATED_AT, SITE_NAME, SITE_ORIGIN } from "@/lib/site";
import { SEO_GUIDES } from "@/lib/seo-guides";

export function GET() {
  return NextResponse.json({
    schemaVersion: 1,
    name: SITE_NAME,
    canonicalUrl: SITE_ORIGIN,
    updatedAt: CONTENT_UPDATED_AT.toISOString(),
    languages: ["ru", "en"],
    privacy: "Only public product metadata is included. Private party and user data are excluded.",
    games: GAME_MANIFEST.map((game) => ({
      id: game.id,
      slug: game.seo.slug,
      url: `${SITE_ORIGIN}/games/${game.seo.slug}`,
      category: game.category,
      releaseStatus: game.releaseStatus,
      players: formatPlayerRange(game),
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      ageRating: game.ageRating,
      durationMinutes: game.seo.durationMinutes,
      equipment: game.seo.equipment,
      capabilities: game.capabilities,
    })),
    guides: ["ru", "en"].flatMap((locale) => SEO_GUIDES.map(([slug, ruTitle, enTitle]) => ({ locale, slug, title: locale === "ru" ? ruTitle : enTitle, url: `${SITE_ORIGIN}/${locale}/guides/${slug}` }))),
  }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
