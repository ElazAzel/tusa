import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";
import { GAME_COUNT, GAME_MANIFEST, formatPlayerRange } from "@/lib/games/manifest";
import BrandLogo from "@/app/components/BrandLogo";
import GameCatalogue from "./GameCatalogue";

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
  ru: { beta: "Мультиплеер · beta", quick_tool: "Инструмент тусы", full_game: "Полная игра", players: "игроков", open: "Правила и детали", search: "Найти игру по названию или механике", all: "Все режимы", full: "Полные игры", tools: "Быстрые режимы", result: "режимов", empty: "Ничего не найдено — сбрось фильтры" },
  en: { beta: "Multiplayer · beta", quick_tool: "Party tool", full_game: "Full game", players: "players", open: "Rules and details", search: "Search by title or mechanic", all: "All modes", full: "Full games", tools: "Quick modes", result: "modes", empty: "No matches — reset the filters" },
} as const;

export default async function GamesPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? requestHeaders.get("accept-language"));
  const t = (key: Parameters<typeof copy>[1]) => copy(locale, key);
  const ui = labels[locale];

  return (
    <main className="games-page">
      <header className="catalogue-header"><Link href="/" aria-label="TUSA.game"><BrandLogo priority /></Link><Link href="/">{t("backToParties")}</Link></header>
      <section className="catalogue-hero"><span>{GAME_COUNT} · TUSA.game</span><h1>{t("gamesTitle")}</h1><p>{t("gamesBandLead")}</p></section>
      <GameCatalogue copy={{ search: ui.search, all: ui.all, full: ui.full, tools: ui.tools, result: ui.result, empty: ui.empty }} games={GAME_MANIFEST.map((game) => ({ id: game.id, title: t(game.titleKey), description: t(game.descKey), category: game.category, categoryLabel: game.category === "quick_tool" ? ui.quick_tool : ui.full_game, playerLabel: `${formatPlayerRange(game)} ${ui.players}`, statusLabel: ui.beta, openLabel: ui.open, slug: game.seo.slug, tone: game.tone }))} />
    </main>
  );
}
