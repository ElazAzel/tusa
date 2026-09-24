import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

const ABOUT = {
  ru: {
    title: "О TUSA.game",
    sections: [
      { heading: "Зачем мы это делаем", text: "TUSA.game собирает людей вместе через игры в браузере. Одна ссылка, ничего не нужно скачивать, можно сразу играть." },
      { heading: "Как всё началось", text: "Хорошей тусе нужны игры, но никто не хочет ставить ещё одно приложение. Поэтому TUSA.game работает в браузере на любом устройстве и собирает друзей по одной ссылке." },
      { heading: "Что внутри", items: ["32 режима: от полноценных игр на всю компанию до быстрых инструментов для вечеринки", "Экран и пульты: ведущий показывает игру на большом экране, друзья играют с телефонов", "Сессии восстанавливаются после обрыва связи", "Чат, галерея, опросы и список покупок для самой тусы", "TUSA.game можно добавить на главный экран телефона"] },
      { heading: "На чём сделано", text: "Next.js, React, TypeScript, Neon Postgres и Vercel." },
      { heading: "Для кого", text: "Для друзей в любом городе: от Алматы до Берлина и Сан-Паулу." },
    ],
  },
  en: {
    title: "About TUSA.game",
    sections: [
      { heading: "Mission", text: "TUSA.game brings people together through browser-based party games. One link. No downloads. Just fun." },
      { heading: "Story", text: "Great parties need great games, but nobody wants to install yet another app. TUSA.game runs in the browser, works on any device, and connects friends through a single link." },
      { heading: "Features", items: ["32 party game modes from full multiplayer games to quick party tools", "Stage and controllers: the host shows the game on a big screen, friends play from their phones", "Recoverable real-time sessions", "Chat, gallery, polls and a shopping list for the party itself", "Install TUSA.game on your home screen"] },
      { heading: "Tech", text: "Built with Next.js, React, TypeScript, Neon Postgres, and Vercel." },
      { heading: "Global-first", text: "Designed for friends everywhere, from Almaty to Berlin to São Paulo." },
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  return { title: "About | TUSA.game", description: "TUSA.game is a browser-based social gaming platform — 32 party game modes, one link, no downloads. Learn about our mission and story." };
}

export default async function AboutPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? requestHeaders.get("accept-language"));
  const t = (key: string) => copy(locale, key as never);
  const c = ABOUT[locale];
  return <main className="legal-page"><div className="legal-container"><Link href="/" className="legal-back">{t("notFoundHome")}</Link><h1>{c.title}</h1>{c.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{"items" in section ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{section.text}</p>}</section>)}</div></main>;
}
