import type { MetadataRoute } from "next";
import { GAME_MANIFEST } from "@/lib/games/manifest";
import { CONTENT_UPDATED_AT, SITE_ORIGIN } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ["", "weekly", 1],
    ["/games", "weekly", 0.9],
    ["/use-cases/online-parties", "monthly", 0.7],
    ["/use-cases/remote-teams", "monthly", 0.7],
    ["/use-cases/in-person-parties", "monthly", 0.7],
    ["/faq", "monthly", 0.7],
    ["/about", "monthly", 0.6],
    ["/partners", "monthly", 0.6],
    ["/privacy", "monthly", 0.3],
    ["/terms", "monthly", 0.3],
  ] as const;

  const staticEntries: MetadataRoute.Sitemap = pages.map(([path, changeFrequency, priority]) => ({
    url: `${SITE_ORIGIN}${path}`,
    lastModified: CONTENT_UPDATED_AT,
    changeFrequency,
    priority,
  }));
  const gameEntries: MetadataRoute.Sitemap = GAME_MANIFEST.map((game) => ({
    url: `${SITE_ORIGIN}/games/${game.seo.slug}`,
    lastModified: CONTENT_UPDATED_AT,
    changeFrequency: "monthly",
    priority: game.category === "full_game" ? 0.8 : 0.6,
  }));
  return [...staticEntries, ...gameEntries];
}
