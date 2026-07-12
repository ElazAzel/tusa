import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "About | TUSA.game", description: "TUSA.game is a browser-based social gaming platform — 28 party games, one link, no downloads. Learn about our mission and story." };
}

export default async function AboutPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? requestHeaders.get("accept-language"));
  const t = (key: string) => copy(locale, key as never);
  return <main className="legal-page"><div className="legal-container"><Link href="/" className="legal-back">{t("backToParties")}</Link><h1>About TUSA.game</h1><section><h2>Mission</h2><p>TUSA.game brings people together through browser-based party games. One link. No downloads. Just fun.</p></section><section><h2>Story</h2><p>Born from the idea that great parties need great games — but nobody wants to install yet another app. TUSA.game runs in the browser, works on any device, and connects friends through a single link.</p></section><section><h2>Features</h2><ul><li>32 party game modes from full multiplayer games to quick party tools</li><li>Stage+Controller: host shows the game on their screen, friends play from their phones</li><li>Recoverable real-time sessions</li><li>Chat, gallery, polls, shopping list — everything for a perfect party</li><li>Install TUSA.game on your home screen</li></ul></section><section><h2>Tech</h2><p>Built with Next.js, React, TypeScript, Neon Postgres, and Vercel.</p></section><section><h2>Global-first</h2><p>Designed for friends everywhere — from Almaty to Berlin to São Paulo.</p></section></div></main>;
}
