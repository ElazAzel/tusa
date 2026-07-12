/*
  Styles go in app/globals.css:
  - .games-page — main container
  - .legal-back — back link
  - .games-grid — CSS grid container
  - .game-card — individual game card
  - .game-card h2 — game title
  - .game-card p — game description
*/

import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { copy, normalizeLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const store = await cookies();
  const locale = normalizeLocale(store.get("tusa_locale")?.value);
  return { title: copy(locale, "gamesTitle"), description: copy(locale, "gamesBandTitle") };
}

const GAME_KEYS = [
  ["gamesAliasTitle", "gamesAliasDesc"],
  ["gamesMafiaTitle", "gamesMafiaDesc"],
  ["gamesTruthTitle", "gamesTruthDesc"],
  ["gamesNeverTitle", "gamesNeverDesc"],
  ["gamesBeerTitle", "gamesBeerDesc"],
  ["gamesQuizTitle", "gamesQuizDesc"],
  ["gamesPairsTitle", "gamesPairsDesc"],
  ["gamesUnoTitle", "gamesUnoDesc"],
  ["gamesWerewolfTitle", "gamesWerewolfDesc"],
  ["gamesCodenamesTitle", "gamesCodenamesDesc"],
  ["gamesSpyfallTitle", "gamesSpyfallDesc"],
  ["gamesImpostorTitle", "gamesImpostorDesc"],
  ["gamesCrocodilTitle", "gamesCrocodilDesc"],
  ["gamesHeadsUpTitle", "gamesHeadsUpDesc"],
  ["gamesPictionaryTitle", "gamesPictionaryDesc"],
  ["gamesQuiplashTitle", "gamesQuiplashDesc"],
  ["gamesFibbageTitle", "gamesFibbageDesc"],
  ["gamesWouldRatherTitle", "gamesWouldRatherDesc"],
  ["gamesTwoTruthsTitle", "gamesTwoTruthsDesc"],
  ["gamesBlankSlateTitle", "gamesBlankSlateDesc"],
  ["gamesWavelengthTitle", "gamesWavelengthDesc"],
  ["gamesBrainBurstTitle", "gamesBrainBurstDesc"],
  ["gamesGuessSongTitle", "gamesGuessSongDesc"],
  ["gamesBombPartyTitle", "gamesBombPartyDesc"],
  ["gamesGarticPhoneTitle", "gamesGarticPhoneDesc"],
  ["gamesBunkerTitle", "gamesBunkerDesc"],
  ["gamesWheelTitle", "gamesWheelDesc"],
  ["gamesKissMarryTitle", "gamesKissMarryDesc"],
  ["gamesCharadesTitle", "gamesCharadesDesc"],
  ["gamesCardsTitle", "gamesCardsDesc"],
  ["gamesMusicQuizTitle", "gamesMusicQuizDesc"],
  ["gamesTriviaTitle", "gamesTriviaDesc"],
] as const;

export default async function GamesPage() {
  const store = await cookies();
  const requestHeaders = await headers();
  const locale = normalizeLocale(store.get("tusa_locale")?.value ?? (await requestHeaders).get("accept-language"));
  const t = (key: string) => copy(locale, key as never);
  return (
    <main className="games-page">
      <Link href="/" className="legal-back">{t("backToParties")}</Link>
      <h1>{t("gamesTitle")}</h1>
      <p className="games-band">28 {t("gamesBandTitle")}</p>
      <div className="games-grid">
        {GAME_KEYS.map(([titleKey, descKey]) => (
          <div key={titleKey} className="game-card">
            <h2>{t(titleKey)}</h2>
            <p>{t(descKey)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
