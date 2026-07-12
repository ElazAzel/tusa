import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";
import { GAME_COUNT, GAME_MANIFEST, formatPlayerRange } from "@/lib/games/manifest";

export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  const locale = normalizeLocale(store.get("tusa_locale")?.value);
  return {
    title: copy(locale, "gamesTitle"),
    description: copy(locale, "gamesBandTitle"),
    alternates: { canonical: "/games" },
  };
}

const labels = {
  ru: { beta: "Мультиплеер · beta", quick_tool: "Инструмент тусы", full_game: "Полная игра", players: "игроков", open: "Правила и детали" },
  en: { beta: "Multiplayer · beta", quick_tool: "Party tool", full_game: "Full game", players: "players", open: "Rules and details" },
} as const;

export default async function GamesPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? requestHeaders.get("accept-language"));
  const t = (key: Parameters<typeof copy>[1]) => copy(locale, key);
  const ui = labels[locale];

  return (
    <main className="games-page">
      <Link href="/" className="legal-back">{t("backToParties")}</Link>
      <h1>{t("gamesTitle")}</h1>
      <p className="games-band">{GAME_COUNT} {t("gamesBandTitle")}</p>
      <div className="games-grid">
        {GAME_MANIFEST.map((game) => (
          <article key={game.id} className={`game-card game-card--${game.tone}`}>
            <div className="game-card-meta">
              <span>{game.category === "quick_tool" ? ui.quick_tool : ui.full_game}</span>
              <span>{formatPlayerRange(game)} {ui.players}</span>
            </div>
            <h2>{t(game.titleKey)}</h2>
            <p>{t(game.descKey)}</p>
            <div className="game-card-footer">
              <span className="game-status">{ui.beta}</span>
              <Link href={`/games/${game.seo.slug}`}>{ui.open} <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
